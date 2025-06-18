import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { submitArmsLicense, updateField, resetForm } from '../features/armsLicense/armsLicenseSlice';
import FormInput from '../components/forms/FormInput';
import Button from '../components/ui/Button';

const ArmsLicenseForm = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
const { formData, loading, error, success } = useSelector((state) => state.armsLicense);

  // Form validation state
  const [errors, setErrors] = React.useState({});

  // Reset form when component unmounts
  useEffect(() => {
    return () => {
      dispatch(resetForm());
    };
  }, [dispatch]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    dispatch(updateField({ field: name, value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }
    
    if (!formData.holderName.trim()) {
      newErrors.holderName = 'Holder name is required';
    }
    
    if (!formData.issueDate) {
      newErrors.issueDate = 'Issue date is required';
    }
    
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else if (new Date(formData.expiryDate) <= new Date(formData.issueDate)) {
      newErrors.expiryDate = 'Expiry date must be after issue date';
    }
    
    if (!formData.armsType) {
      newErrors.armsType = 'Arms type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const result = await dispatch(submitArmsLicense(formData));
      
      if (result?.payload?.success) {
        // Redirect to success page or show success message
        navigate('/licenses', { state: { success: true } });
      }
    } catch (err) {
      console.error('Failed to submit form:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">New ARMS License</h1>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormInput
            label="License Number"
            name="licenseNumber"
            value={formData.licenseNumber}
            onChange={handleChange}
            placeholder="Enter license number"
            error={errors.licenseNumber}
            required
          />
          
          <FormInput
            label="Holder's Full Name"
            name="holderName"
            value={formData.holderName}
            onChange={handleChange}
            placeholder="Enter full name"
            error={errors.holderName}
            required
          />
          
          <FormInput
            label="Issue Date"
            name="issueDate"
            type="date"
            value={formData.issueDate}
            onChange={handleChange}
            error={errors.issueDate}
            required
          />
          
          <FormInput
            label="Expiry Date"
            name="expiryDate"
            type="date"
            value={formData.expiryDate}
            onChange={handleChange}
            error={errors.expiryDate}
            required
          />
          
          <div className="md:col-span-2">
            <FormInput
              label="Type of Arms"
              name="armsType"
              value={formData.armsType}
              onChange={handleChange}
              placeholder="Enter type of arms"
              error={errors.armsType}
              required
            />
          </div>
          
          <div className="md:col-span-2">
            <FormInput
              label="Arms Details"
              name="armsDetails"
              value={formData.armsDetails}
              onChange={handleChange}
              placeholder="Enter arms details (make, model, serial number, etc.)"
              multiline
              rows={3}
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {loading ? 'Submitting...' : 'Submit License'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ArmsLicenseForm;
