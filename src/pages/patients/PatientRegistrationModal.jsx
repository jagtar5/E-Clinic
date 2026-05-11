import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import db from '../../lib/store';
import { X, UserPlus } from 'lucide-react';

const patientSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  age: z.coerce.number().min(0, 'Invalid age').max(150, 'Invalid age'),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Select gender' }),
  contact: z.string().min(7, 'Enter a valid phone number'),
  address: z.string().optional().default(''),
  emergency_contact: z.string().optional().default(''),
  blood_group: z.string().optional().default(''),
  chronic_conditions: z.string().optional().default(''),
});

export default function PatientRegistrationModal({ onClose, onRegistered, editPatient }) {
  const isEdit = !!editPatient;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(patientSchema),
    defaultValues: editPatient
      ? {
          ...editPatient,
          chronic_conditions: editPatient.chronic_conditions?.join(', ') || '',
        }
      : {
          full_name: '',
          age: '',
          gender: '',
          contact: '',
          address: '',
          emergency_contact: '',
          blood_group: '',
          chronic_conditions: '',
        },
  });

  function onSubmit(data) {
    const record = {
      ...data,
      chronic_conditions: data.chronic_conditions
        ? data.chronic_conditions.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    };

    if (isEdit) {
      db.update('patients', editPatient.id, record);
    } else {
      db.insert('patients', record);
    }

    onRegistered();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg glass-strong rounded-2xl animate-scale-in overflow-hidden"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-5"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-(--color-accent-primary)" />
            {isEdit ? 'Edit Patient' : 'Register New Patient'}
          </h2>
          <button className="btn-ghost p-1.5" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {/* Full Name */}
          <div>
            <label htmlFor="reg-name" className="label">Full Name *</label>
            <input id="reg-name" className="input" placeholder="e.g. Muhammad Ali Khan" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-(--color-accent-danger) mt-1">{errors.full_name.message}</p>}
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-age" className="label">Age *</label>
              <input id="reg-age" type="number" className="input" placeholder="e.g. 35" {...register('age')} />
              {errors.age && <p className="text-xs text-(--color-accent-danger) mt-1">{errors.age.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-gender" className="label">Gender *</label>
              <select id="reg-gender" className="input appearance-none cursor-pointer" {...register('gender')}>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && <p className="text-xs text-(--color-accent-danger) mt-1">{errors.gender.message}</p>}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label htmlFor="reg-contact" className="label">Phone Number *</label>
            <input id="reg-contact" className="input" placeholder="e.g. 0300-1234567" {...register('contact')} />
            {errors.contact && <p className="text-xs text-(--color-accent-danger) mt-1">{errors.contact.message}</p>}
          </div>

          {/* Address */}
          <div>
            <label htmlFor="reg-address" className="label">Address</label>
            <input id="reg-address" className="input" placeholder="e.g. House 12, G-10, Islamabad" {...register('address')} />
          </div>

          {/* Emergency Contact & Blood Group */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-emergency" className="label">Emergency Contact</label>
              <input id="reg-emergency" className="input" placeholder="0301-7654321" {...register('emergency_contact')} />
            </div>
            <div>
              <label htmlFor="reg-blood" className="label">Blood Group</label>
              <select id="reg-blood" className="input appearance-none cursor-pointer" {...register('blood_group')}>
                <option value="">Select</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
          </div>

          {/* Chronic Conditions */}
          <div>
            <label htmlFor="reg-chronic" className="label">Chronic Conditions</label>
            <input
              id="reg-chronic"
              className="input"
              placeholder="e.g. Hypertension, Diabetes (comma separated)"
              {...register('chronic_conditions')}
            />
            <p className="text-xs text-(--color-text-muted) mt-1">Separate multiple conditions with commas</p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="spinner" style={{ width: '1rem', height: '1rem' }} />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  {isEdit ? 'Update Patient' : 'Register Patient'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
