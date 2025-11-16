'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { buildApiUrl } from '@/lib/config';
import {
  AlertCircleIcon,
  Cancel01Icon,
  Add01Icon,
  UserIcon,
  BedIcon,
  HeadphonesIcon,
  Building03Icon
} from '@/lib/icons';

const CustomerComplaintPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    room_number: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    title: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0]
  });

  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images
    const newImages = [...selectedImages, ...files].slice(0, 5);
    setSelectedImages(newImages);

    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create the complaint
      const response = await fetch(buildApiUrl('hotel/complaints/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formData.category,
          priority: formData.priority,
          title: formData.title,
          description: formData.description,
          incident_date: formData.incident_date
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to submit complaint');
        return;
      }

      const newComplaint = await response.json();
      setComplaintNumber(newComplaint.complaint_number);

      // Upload images if any
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const imageFormData = new FormData();
          imageFormData.append('image', image);
          imageFormData.append('complaint', newComplaint.id.toString());

          await fetch(buildApiUrl('hotel/complaint-images/'), {
            method: 'POST',
            body: imageFormData
          });
        }
      }

      // Success
      setSuccess(true);
    } catch (err: any) {
      setError('Failed to submit complaint. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeadphonesIcon className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Submitted Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your complaint has been received and assigned complaint number:
          </p>
          <div className="bg-gray-50 border border-gray-200 py-3 px-4 mb-6">
            <div className="text-2xl font-bold text-[#005357]">{complaintNumber}</div>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Our team will review your complaint and get back to you shortly. Please save this complaint number for your reference.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                guest_name: '',
                guest_email: '',
                guest_phone: '',
                room_number: '',
                category: 'OTHER',
                priority: 'MEDIUM',
                title: '',
                description: '',
                incident_date: new Date().toISOString().split('T')[0]
              });
              setSelectedImages([]);
              setImagePreviews([]);
            }}
            className="w-full px-4 py-2 bg-[#005357] text-white font-medium hover:bg-[#004147] transition-colors"
          >
            Submit Another Complaint
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-[#005357] flex items-center justify-center">
              <HeadphonesIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Submit a Complaint</h1>
              <p className="text-sm text-gray-600">We value your feedback and will address your concerns promptly</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 flex items-start space-x-3">
              <AlertCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Error</div>
                <div className="text-sm">{error}</div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Guest Information */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Guest Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guest_name}
                    onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.guest_email}
                    onChange={(e) => setFormData({ ...formData, guest_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    placeholder="your.email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.guest_phone}
                    onChange={(e) => setFormData({ ...formData, guest_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    placeholder="+62 812 3456 7890"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Room Number (if applicable)</label>
                  <input
                    type="text"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    placeholder="e.g. 101"
                  />
                </div>
              </div>
            </div>

            {/* Complaint Details */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Building03Icon className="h-5 w-5" />
                <span>Complaint Details</span>
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    >
                      <option value="SERVICE">Service</option>
                      <option value="ROOM">Room</option>
                      <option value="FACILITY">Facility</option>
                      <option value="BILLING">Billing</option>
                      <option value="FOOD">Food & Beverage</option>
                      <option value="CLEANLINESS">Cleanliness</option>
                      <option value="NOISE">Noise</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
                    <select
                      required
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Incident Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    placeholder="Brief summary of your complaint"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    rows={5}
                    placeholder="Please provide detailed information about your complaint..."
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Evidence Images (Optional)
                  </label>
                  <div className="space-y-3">
                    {/* File Input */}
                    <div className="flex items-center space-x-3">
                      <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                        <Add01Icon className="h-4 w-4" />
                        <span>Add Images</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                      <span className="text-xs text-gray-500">Maximum 5 images</span>
                    </div>

                    {/* Image Previews */}
                    {imagePreviews.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Cancel01Icon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] disabled:opacity-50 transition-colors"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Complaint'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerComplaintPage;
