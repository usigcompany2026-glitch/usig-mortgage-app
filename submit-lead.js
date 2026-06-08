const fetch = require('node-fetch');

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

  try {
    const payload = JSON.parse(event.body);

    // 1. Create GHL Contact
    const contactRes = await fetch('https://api.gohighlevel.com/v1/contacts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GHL_API_KEY}`
      },
      body: JSON.stringify({
        locationId: GHL_LOCATION_ID,
        firstName: payload.contactFirstName,
        lastName: payload.contactLastName,
        email: payload.contactEmail,
        phone: payload.contactPhone,
        tags: payload.tags || ['mortgage-inquiry'],
        source: 'USIG Mobile App',
        customFields: {
          'Lead_Source': 'USIG Mobile App',
          'Property_Type': payload.customFields?.Property_Type || '',
          'Loan_Type': payload.customFields?.Loan_Type || 'Mortgage',
        }
      })
    });

    if (!contactRes.ok) {
      throw new Error(`GHL Contact error: ${contactRes.statusText}`);
    }

    const contactData = await contactRes.json();
    const contactId = contactData.id || contactData.contact?.id;

    // 2. Send SMS notification to Brenda
    if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && BRENDA_PHONE) {
      const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
      const smsBody = `🔴 NEW MORTGAGE LEAD: ${payload.contactFirstName} ${payload.contactLastName} | ${payload.customFields?.Property_Type || 'Property'} | Loan: $${payload.monetaryValue || 0} | Phone: ${payload.contactPhone}`;

      try {
        await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: TWILIO_FROM_NUMBER,
            To: BRENDA_PHONE,
            Body: smsBody
          })
        });
      } catch (smsError) {
        console.error('SMS error:', smsError);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        contactId: contactId,
        message: 'Lead submitted successfully'
      })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
