"use client";

import { scanReciept } from '@/actions/transaction';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { Camera, Loader2 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const ReceiptScanner = ({ onScanComplete }) => {
  const fileInputRef = useRef();
  const {
    loading: scanReciptLoading,
    fn: scanReciptFn,
    data: scannedData,
  } = useFetch(scanReciept);

  const handleRecieptScan = async (file) => {
  if (file.size > 10 * 1024 * 1024) {
    toast.error("File size should be less than 10MB");
    return;
  }

  const reader = new FileReader();

  reader.onloadend = async () => {
    const result = reader.result;
    const base64 = result.split(',')[1]; // remove the prefix like: data:image/jpeg;base64,...

    try {
      await scanReciptFn({
        base64,
        mimetype: file.type,
      });
    } catch (error) {
      toast.error("Failed to scan receipt");
      console.error(error);
    }
  };

  reader.readAsDataURL(file);
};

  useEffect(()=>{
    if(scannedData&&!scanReciptLoading){
      onScanComplete(scannedData);
      toast.success("recipt scanned successfully");
    }
  },[scanReciptLoading,scannedData])

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleRecieptScan(file);
        }}
      />
      <Button
      type="button"
      varient="outline"
       className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500
      to purple-500 animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white cursor-pointer"
       onClick={() => fileInputRef.current?.click()}
       disabled={scanReciptLoading}>
        {scanReciptLoading ? (
          <>
          <Loader2 className='mr-2 animate-spin'/>
          <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptScanner;
