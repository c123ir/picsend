import React, { useState, useCallback } from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  maxSize?: number; // حداکثر سایز به مگابایت
  acceptedTypes?: string[]; // انواع فایل‌های مجاز
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  maxSize = 5, // پیش‌فرض 5 مگابایت
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif']
}) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      setError('فرمت فایل مجاز نیست');
      return false;
    }

    if (file.size > maxSize * 1024 * 1024) {
      setError(`حجم فایل باید کمتر از ${maxSize} مگابایت باشد`);
      return false;
    }

    return true;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    
    if (file && validateFile(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
      setError('');
    }
  }, [validateFile, onImageSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageSelect(file);
      setError('');
    }
  };

  const handleDelete = () => {
    setPreview(null);
    setError('');
  };

  return (
    <Box>
      <Box
        sx={{
          border: '2px dashed #ccc',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main'
          }
        }}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {preview ? (
          <Box sx={{ position: 'relative' }}>
            <img
              src={preview}
              alt="پیش‌نمایش"
              style={{ maxWidth: '100%', maxHeight: '200px' }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                bgcolor: 'background.paper'
              }}
              onClick={handleDelete}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ) : (
          <>
            <input
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleChange}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label htmlFor="image-upload">
              <CloudUploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
              <Typography>
                تصویر را اینجا رها کنید یا کلیک کنید
              </Typography>
            </label>
          </>
        )}
      </Box>
      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader; 