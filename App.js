import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  navy: '#001f3f',
  gold: '#D4AF37',
  lightGray: '#f8f9fa',
  darkGray: '#2c3e50',
  borderGray: '#e0e0e0',
};

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    propertyType: '',
    loanAmount: '',
    downPayment: '',
    location: '',
    timeline: '',
    loanTypes: [],
    message: '',
  });

  const propertyTypes = [
    'Single Family',
    'Multifamily',
    'Apartment',
    'Retail',
    'Industrial',
    'Office',
    'Hospitality',
    'Land',
  ];

  const timelines = ['0-30 days', '30-60 days', '60-90 days', '90+ days'];
  const loanTypeOptions = ['Conventional', 'DSCR', 'Bridge', 'SBA', 'Hard Money'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleLoanType = (type) => {
    setFormData(prev => ({
      ...prev,
      loanTypes: prev.loanTypes.includes(type)
        ? prev.loanTypes.filter(t => t !== type)
        : [...prev.loanTypes, type],
    }));
  };

  const validateStep1 = () => formData.propertyType && formData.loanAmount && formData.downPayment;
  const validateStep2 = () => formData.firstName && formData.lastName && formData.email && formData.phone;
  const validateStep3 = () => formData.loanTypes.length > 0;

  const handleSubmit = async () => {
    if (!validateStep3()) {
      Alert.alert('Required', 'Please select at least one loan type');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        contactFirstName: formData.firstName,
        contactLastName: formData.lastName,
        contactEmail: formData.email,
        contactPhone: formData.phone,
        propertyType: formData.propertyType,
        purchasePrice: formData.loanAmount,
        downPayment: formData.downPayment,
        location: formData.location,
        timeline: formData.timeline,
        loanTypes: formData.loanTypes,
        message: formData.message,
        customFields: {
          Loan_Type: 'Mortgage',
          Property_Type: formData.propertyType,
        },
        tags: ['mortgage-inquiry', 'usig-app'],
        name: `${formData.firstName} ${formData.lastName}`,
        status: 'active',
        monetaryValue: parseInt(formData.loanAmount) || 0,
        leadScore: 75,
        description: `Mortgage inquiry: ${formData.propertyType} | Loan: $${formData.loanAmount} | Timeline: ${formData.timeline}`,
      };

      const response = await fetch('/.netlify/functions/submit-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert('Success!', 'Your mortgage inquiry has been received. We will contact you within 24 hours.');
        setCurrentStep(1);
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          propertyType: '',
          loanAmount: '',
          downPayment: '',
          location: '',
          timeline: '',
          loanTypes: [],
          message: '',
        });
      } else {
        Alert.alert('Error', result.error || 'Failed to submit. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>USIG</Text>
          <Text style={styles.title}>Mortgage</Text>
          <Text style={styles.subtitle}>Institutional-Grade Financing</Text>
        </View>

        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map(step => (
            <View key={step} style={styles.stepContainer}>
              <View
                style={[
                  styles.stepNumber,
                  currentStep >= step && styles.stepNumberActive,
                ]}
              >
                <Text style={[styles.stepText, currentStep >= step && styles.stepTextActive]}>
                  {step}
                </Text>
              </View>
              <Text style={styles.stepLabel}>
                {step === 1 ? 'Property' : step === 2 ? 'Contact' : 'Confirm'}
              </Text>
            </View>
          ))}
        </View>

        {/* Step 1: Property Details */}
        {currentStep === 1 && (
          <View style={styles.formStep}>
            <Text style={styles.stepTitle}>Property Details</Text>

            <Text style={styles.label}>Property Type *</Text>
            <View style={styles.pickerContainer}>
              {propertyTypes.map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerOption,
                    formData.propertyType === type && styles.pickerOptionActive,
                  ]}
                  onPress={() => handleInputChange('propertyType', type)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.propertyType === type && styles.pickerOptionTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Loan Amount *</Text>
            <TextInput
              style={styles.input}
              placeholder="500000"
              keyboardType="number-pad"
              value={formData.loanAmount}
              onChangeText={value => handleInputChange('loanAmount', value)}
            />

            <Text style={styles.label}>Down Payment % *</Text>
            <TextInput
              style={styles.input}
              placeholder="20"
              keyboardType="number-pad"
              value={formData.downPayment}
              onChangeText={value => handleInputChange('downPayment', value)}
            />

            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="Orange County, CA"
              value={formData.location}
              onChangeText={value => handleInputChange('location', value)}
            />

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                if (validateStep1()) {
                  setCurrentStep(2);
                } else {
                  Alert.alert('Required', 'Please fill all fields');
                }
              }}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Contact Info */}
        {currentStep === 2 && (
          <View style={styles.formStep}>
            <Text style={styles.stepTitle}>Your Information</Text>

            <Text style={styles.label}>First Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="John"
              value={formData.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
            />

            <Text style={styles.label}>Last Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Smith"
              value={formData.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
            />

            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="john@example.com"
              keyboardType="email-address"
              value={formData.email}
              onChangeText={value => handleInputChange('email', value)}
            />

            <Text style={styles.label}>Phone *</Text>
            <TextInput
              style={styles.input}
              placeholder="(949) 555-0100"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={value => handleInputChange('phone', value)}
            />

            <Text style={styles.label}>Timeline</Text>
            <View style={styles.pickerContainer}>
              {timelines.map(time => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.pickerOption,
                    formData.timeline === time && styles.pickerOptionActive,
                  ]}
                  onPress={() => handleInputChange('timeline', time)}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      formData.timeline === time && styles.pickerOptionTextActive,
                    ]}
                  >
                    {time}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => setCurrentStep(1)}
              >
                <Text style={styles.buttonTextSecondary}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.button}
                onPress={() => {
                  if (validateStep2()) {
                    setCurrentStep(3);
                  } else {
                    Alert.alert('Required', 'Please fill all fields');
                  }
                }}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Confirm */}
        {currentStep === 3 && (
          <View style={styles.formStep}>
            <Text style={styles.stepTitle}>Confirm & Submit</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Name:</Text>
              <Text style={styles.reviewValue}>
                {formData.firstName} {formData.lastName}
              </Text>

              <Text style={styles.reviewLabel}>Email:</Text>
              <Text style={styles.reviewValue}>{formData.email}</Text>

              <Text style={styles.reviewLabel}>Phone:</Text>
              <Text style={styles.reviewValue}>{formData.phone}</Text>

              <Text style={styles.reviewLabel}>Property:</Text>
              <Text style={styles.reviewValue}>{formData.propertyType}</Text>

              <Text style={styles.reviewLabel}>Loan Amount:</Text>
              <Text style={styles.reviewValue}>${formData.loanAmount}</Text>
            </View>

            <Text style={styles.label}>Loan Types of Interest *</Text>
            <View style={styles.checkboxContainer}>
              {loanTypeOptions.map(type => (
                <TouchableOpacity
                  key={type}
                  style={styles.checkboxItem}
                  onPress={() => toggleLoanType(type)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      formData.loanTypes.includes(type) && styles.checkboxActive,
                    ]}
                  >
                    {formData.loanTypes.includes(type) && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </View>
                  <Text style={styles.checkboxLabel}>{type}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Additional Details</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us more about your situation..."
              multiline
              numberOfLines={4}
              value={formData.message}
              onChangeText={value => handleInputChange('message', value)}
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonSecondary}
                onPress={() => setCurrentStep(2)}
              >
                <Text style={styles.buttonTextSecondary}>Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, isSubmitting && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#001f3f" />
                ) : (
                  <Text style={styles.buttonText}>Submit Application</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 USIG AI. All rights reserved.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.navy,
    paddingBottom: 20,
  },
  logo: {
    fontSize: 48,
    fontWeight: '900',
    color: COLORS.navy,
    letterSpacing: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.borderGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberActive: {
    backgroundColor: COLORS.navy,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
  },
  stepTextActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.darkGray,
  },
  formStep: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.darkGray,
  },
  textArea: {
    textAlignVertical: 'top',
    minHeight: 100,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerOption: {
    borderWidth: 1.5,
    borderColor: COLORS.borderGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: '45%',
  },
  pickerOptionActive: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
  },
  pickerOptionText: {
    fontSize: 13,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  pickerOptionTextActive: {
    color: COLORS.navy,
    fontWeight: '600',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.gold,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.gold,
  },
  checkmark: {
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 12,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.05)',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.gold,
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  reviewLabel: {
    fontWeight: '600',
    color: COLORS.navy,
    marginTop: 10,
  },
  reviewValue: {
    color: COLORS.darkGray,
    fontSize: 14,
    marginBottom: 10,
  },
  button: {
    backgroundColor: COLORS.navy,
    borderRadius: 8,
    padding: 12,
    flex: 1,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: COLORS.borderGray,
    borderRadius: 8,
    padding: 12,
    flex: 0.4,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  buttonTextSecondary: {
    color: COLORS.darkGray,
    fontWeight: '600',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderGray,
    marginTop: 40,
  },
  footerText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
  },
});
