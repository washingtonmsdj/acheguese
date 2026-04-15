import React from "react";
import { Skeleton } from "@/shared/components/ui/skeleton";
export function BusinessHeaderSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Skeleton className="w-32 h-32 rounded-lg" />
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="w-10 h-10 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BusinessSectionSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Skeleton className="h-10 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <Skeleton className="w-full h-48 rounded-lg mb-3" />
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full mb-3" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BusinessGallerySkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Galeria</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
