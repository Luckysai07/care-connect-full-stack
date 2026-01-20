/**
 * Emergency Report Modal
 * 
 * Modal for adding description and photo proof to SOS request.
 */

import { useState, useRef } from 'react';
import { X, Camera, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';

interface EmergencyReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: { description: string; file: File | null }) => Promise<void>;
    emergencyType: string;
    isLoading: boolean;
}

export function EmergencyReportModal({
    isOpen,
    onClose,
    onSubmit,
    emergencyType,
    isLoading
}: EmergencyReportModalProps) {
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setPreview(URL.createObjectURL(selectedFile));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit({ description, file });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-red-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-white">
                        <AlertTriangle className="h-6 w-6" />
                        <h2 className="text-lg font-bold">Report {emergencyType}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                        disabled={isLoading}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe the situation
                        </label>
                        <textarea
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] resize-none"
                            placeholder="Please provide details about the emergency..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Photo Proof (Optional)
                        </label>
                        <div
                            onClick={triggerFileInput}
                            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${preview ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-red-400 hover:bg-gray-50'
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            {preview ? (
                                <div className="relative">
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="mx-auto max-h-48 rounded-lg object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setPreview(null);
                                        }}
                                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Camera className="h-6 w-6 text-gray-500" />
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium text-red-600">Click to upload</span> or drag and drop
                                    </div>
                                    <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="danger"
                            className="flex-1"
                            isLoading={isLoading}
                        >
                            Send Request
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
