// netlify/functions/submit-lead.js
// Processes USIG mortgage lead form submissions
// Creates GHL contact + opportunity, triggers workflows, sends SMS

const GHL_API_KEY = process.env.GHL_API_KEY;
const GHL_LOCATION_ID = 'x0HFnEGuUCweDyholAxD';
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;
const BRENDA_PHONE = process.env.BRENDA_PHONE;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    let payload;
    try {
        payload = JSON.parse(event.body);
    } catch {
        return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }

    try {
        const contactResult = await createOrUpdateGHLContact(payload);
        const opportunityResult = await createGHLOpportunity(payload, contactResult.id);
        await triggerGHLConversation(payload, contactResult.id);

        if (payload.status === 'active') {
            await sendSMSNotification(payload, opportunityResult);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                contactId: contactResult.id,
                opportunityId: opportunityResult.id,
                leadQuality: payload.status,
                message: 'Lead processed successfully',
            }),
        };
    } catch (error) {
        console.error('Function error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, error: error.message }),
        };
    }
};

async function createOrUpdateGHLContact(payload) {
    const res = await fetch('https://api.gohighlevel.com/v1/contacts/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GHL_API_KEY}`,
        },
        body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            firstName: payload.contactFirstName,
            lastName: payload.contactLastName,
            email: payload.contactEmail,
            phone: payload.contactPhone,
            tags: payload.tags,
            source: 'USIG Form - Enhanced',
            customFields: {
                Lead_Source: 'USIG Form - Enhanced',
                Lead_Quality: payload.status === 'active' ? 'WARM' : 'COLD',
                Qualification_Score: payload.leadScore?.toString() || '0',
            },
        }),
    });
    if (!res.ok) throw new Error(`GHL Contact error: ${res.statusText}`);
    const data = await res.json();
    return { id: data.id || data.contact?.id, contact: data.contact || data };
}

async function createGHLOpportunity(payload, contactId) {
    const stageMap = { warm: 'your-ghl-warm-stage-id', cold: 'your-ghl-cold-stage-id' };
    const res = await fetch('https://api.gohighlevel.com/v1/opportunities/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GHL_API_KEY}`,
        },
        body: JSON.stringify({
            locationId: GHL_LOCATION_ID,
            contactId,
            name: payload.name,
            pipelineId: 'mortgage-pipeline',
            pipelineStageId: stageMap[payload.status] || 'new-lead',
            status: payload.status,
            monetaryValue: payload.monetaryValue || 0,
            description: payload.description,
            customFields: payload.customFields,
            tags: payload.tags,
        }),
    });
    if (!res.ok) throw new Error(`GHL Opportunity error: ${res.statusText}`);
    const data = await res.json();
    return { id: data.id || data.opportunity?.id, opportunity: data.opportunity || data };
}

async function triggerGHLConversation(payload, contactId) {
    const workflows = { warm: 'immediate-follow-up-workflow', cold: '90-day-nurture-workflow' };
    try {
        await fetch('https://api.gohighlevel.com/v1/automations/triggers/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${GHL_API_KEY}`,
            },
            body: JSON.stringify({
                locationId: GHL_LOCATION_ID,
                contactId,
                workflowId: workflows[payload.status],
                loanType: payload.customFields.Loan_Type,
                leadQuality: payload.status,
            }),
        });
    } catch (err) {
        console.warn('Workflow trigger error (non-critical):', err.message);
    }
}

async function sendSMSNotification(payload, opportunityResult) {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !BRENDA_PHONE) return;

    const loanType = payload.customFields.Loan_Type;
    const name = `${payload.contactFirstName} ${payload.contactLastName}`;
    const loanAmount = payload.monetaryValue
        ? `$${(payload.monetaryValue / 1000000).toFixed(1)}M`
        : 'TBD';
    const score = payload.leadScore || 0;
    const docsNote = payload.customFields.Documents_Attached
        ? ` | 📎 ${payload.customFields.Documents_Attached} doc(s) attached`
        : '';

    let smsBody;
    if (loanType === 'Commercial Real Estate') {
        const prop = payload.customFields.CRE_Property_Type || 'TBD';
        const cap = payload.customFields.CRE_Cap_Rate || 'TBD';
        smsBody = `🔴 WARM CRE LEAD: ${name} | ${prop} | Loan: ${loanAmount} | Cap: ${cap}% | Score: ${score}/100${docsNote} | ☎ ${payload.contactPhone}`;
    } else {
        const credit = payload.customFields.Credit_Score_Range || 'TBD';
        smsBody = `🔴 WARM RES LEAD: ${name} | Loan: ${loanAmount} | Credit: ${credit} | Score: ${score}/100${docsNote} | ☎ ${payload.contactPhone}`;
    }

    try {
        const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
        await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({ From: TWILIO_FROM_NUMBER, To: BRENDA_PHONE, Body: smsBody }),
            }
        );
    } catch (err) {
        console.error('SMS error (non-critical):', err.message);
    }
}
