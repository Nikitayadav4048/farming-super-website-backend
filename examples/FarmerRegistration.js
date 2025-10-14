// React Native Example for Farmer Registration with Image Upload
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';

const FarmerRegistration = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    village: '',
    block: '',
    district: '',
    state: '',
    pin: '',
    category: 'General',
    farmArea: '',
    primaryCrops: '',
    aadharNumber: '',
    panNumber: '',
    accountHolder: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    ifsc: '',
    upi: '',
    farmLocation: {
      latitude: '',
      longitude: ''
    }
  });

  const [images, setImages] = useState({
    aadharFront: null,
    aadharBack: null,
    selfie: null,
    cheque: null,
    farmPhoto: null
  });

  const pickImage = (imageType) => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        setImages(prev => ({
          ...prev,
          [imageType]: response.assets[0]
        }));
      }
    });
  };

  const submitForm = async () => {
    try {
      const formDataToSend = new FormData();
      
      // Add text fields
      Object.keys(formData).forEach(key => {
        if (key === 'farmLocation') {
          formDataToSend.append('farmLocation[latitude]', formData.farmLocation.latitude);
          formDataToSend.append('farmLocation[longitude]', formData.farmLocation.longitude);
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add images
      Object.keys(images).forEach(key => {
        if (images[key]) {
          formDataToSend.append(key, {
            uri: images[key].uri,
            type: images[key].type,
            name: images[key].fileName || `${key}.jpg`
          });
        }
      });

      const response = await fetch('http://your-backend-url/api/farmer/register', {
        method: 'POST',
        body: formDataToSend,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Success', 'Farmer registered successfully!');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Registration failed');
      console.error(error);
    }
  };

  return (
    <ScrollView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Farmer Registration
      </Text>

      <TextInput
        placeholder="Full Name"
        value={formData.fullName}
        onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Mobile Number"
        value={formData.mobile}
        onChangeText={(text) => setFormData(prev => ({ ...prev, mobile: text }))}
        keyboardType="numeric"
        maxLength={10}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Aadhaar Number"
        value={formData.aadharNumber}
        onChangeText={(text) => setFormData(prev => ({ ...prev, aadharNumber: text }))}
        keyboardType="numeric"
        maxLength={12}
        style={{ borderWidth: 1, padding: 10, marginBottom: 10 }}
      />

      <TouchableOpacity
        onPress={() => pickImage('aadharFront')}
        style={{ backgroundColor: '#007bff', padding: 15, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {images.aadharFront ? 'Aadhaar Front ✓' : 'Upload Aadhaar Front'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => pickImage('aadharBack')}
        style={{ backgroundColor: '#007bff', padding: 15, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {images.aadharBack ? 'Aadhaar Back ✓' : 'Upload Aadhaar Back'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => pickImage('selfie')}
        style={{ backgroundColor: '#007bff', padding: 15, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {images.selfie ? 'Selfie ✓' : 'Upload Selfie'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => pickImage('cheque')}
        style={{ backgroundColor: '#007bff', padding: 15, marginBottom: 10 }}
      >
        <Text style={{ color: 'white', textAlign: 'center' }}>
          {images.cheque ? 'Bank Cheque ✓' : 'Upload Bank Cheque'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={submitForm}
        style={{ backgroundColor: '#28a745', padding: 15 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontSize: 18 }}>
          Register Farmer
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default FarmerRegistration;