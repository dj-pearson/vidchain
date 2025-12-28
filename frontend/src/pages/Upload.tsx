import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadVideo, useCreateVerification } from '@/hooks';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Progress } from '@/components/ui/Progress';
import { AlertWithIcon } from '@/components/ui/Alert';
import { ROUTES, MAX_FILE_SIZE_MB, ALLOWED_VIDEO_TYPES } from '@/config/constants';
import { formatFileSize } from '@/lib/utils';
import { Upload as UploadIcon, Video, X, CheckCircle, AlertCircle } from 'lucide-react';

interface FormData {
  file: File | null;
  title: string;
  description: string;
  autoMint: boolean;
}

export function Upload() {
  const navigate = useNavigate();
  const { upload, progress, isUploading, error: uploadError } = useUploadVideo();
  const createVerification = useCreateVerification();

  const [formData, setFormData] = useState<FormData>({
    file: null,
    title: '',
    description: '',
    autoMint: false,
  });
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload MP4, MOV, or WebM files.';
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`;
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      setValidationError(error);
      return;
    }

    setValidationError(null);
    setFormData((prev) => ({
      ...prev,
      file,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ''),
    }));
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value, type } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.file) {
      setValidationError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setValidationError('Please enter a title');
      return;
    }

    try {
      const video = await upload(formData.file, formData.title, formData.description);

      if (formData.autoMint) {
        await createVerification.mutateAsync({
          videoId: video.id,
          autoMint: true,
        });
      }

      setUploadSuccess(true);
      setTimeout(() => {
        navigate(ROUTES.video(video.id));
      }, 2000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const removeFile = () => {
    setFormData((prev) => ({ ...prev, file: null }));
    setValidationError(null);
  };

  if (uploadSuccess) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="flex flex-col items-center py-12">
            <CheckCircle className="h-16 w-16 text-success" />
            <h2 className="mt-4 text-2xl font-bold">Upload Complete!</h2>
            <p className="mt-2 text-muted-foreground">
              Your video is being processed. Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Video</h1>
        <p className="text-muted-foreground">
          Upload a video to create a verified authenticity record
        </p>
      </div>

      {(validationError || uploadError) && (
        <AlertWithIcon variant="destructive" title="Error">
          {validationError || uploadError?.message}
        </AlertWithIcon>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Video File</CardTitle>
            <CardDescription>
              Supported formats: MP4, MOV, WebM. Max size: {MAX_FILE_SIZE_MB}MB
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formData.file ? (
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <Video className="h-10 w-10 text-primary" />
                  <div>
                    <p className="font-medium">{formData.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(formData.file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className={`relative cursor-pointer rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept={ALLOWED_VIDEO_TYPES.join(',')}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <UploadIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">
                  Drag and drop your video here
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse files
                </p>
              </div>
            )}

            {isUploading && (
              <div className="mt-4">
                <Progress value={progress} showLabel />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Details */}
        <Card>
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
            <CardDescription>
              Add information about your video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="title" className="text-sm font-medium">
                Title *
              </label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter video title"
                className="mt-1"
                disabled={isUploading}
              />
            </div>

            <div>
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional description"
                rows={3}
                className="mt-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isUploading}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoMint"
                name="autoMint"
                checked={formData.autoMint}
                onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300"
                disabled={isUploading}
              />
              <label htmlFor="autoMint" className="text-sm">
                Automatically mint NFT after verification
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.videos)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isUploading} className="flex-1">
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </div>
      </form>
    </div>
  );
}
