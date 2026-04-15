import React from "react";
import { useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
interface BusinessGalleryProps {
  images: string[];
  businessName: string;
}

export function BusinessGallery({
  images,
  businessName,
}: BusinessGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const handlePrevious = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === 0 ? images.length - 1 : selectedImage - 1,
      );
    }
  };

  const handleNext = () => {
    if (selectedImage !== null) {
      setSelectedImage(
        selectedImage === images.length - 1 ? 0 : selectedImage + 1,
      );
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Galeria</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="aspect-square cursor-pointer overflow-hidden rounded-lg hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(index)}
            >
              <img
                src={image}
                alt={`${businessName} - Imagem ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Modal de visualização */}
      {selectedImage !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X size={32} />
          </button>

          <button
            onClick={handlePrevious}
            className="absolute left-4 text-white hover:text-gray-300"
          >
            <ChevronLeft size={48} />
          </button>

          <img
            src={images[selectedImage]}
            alt={`${businessName} - Imagem ${selectedImage + 1}`}
            className="max-w-full max-h-full object-contain"
          />

          <button
            onClick={handleNext}
            className="absolute right-4 text-white hover:text-gray-300"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-4 text-white">
            {selectedImage + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
