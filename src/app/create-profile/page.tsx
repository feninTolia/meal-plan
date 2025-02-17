'use client';
import { useUser } from '@clerk/nextjs';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type ApiResponse = { message: string; error?: string };

const createProfileRequest = async () => {
  const response = await fetch('/api/create-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  const data = await response.json();
  return data as ApiResponse;
};

const CreateProfilePage = () => {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { mutate, isPending } = useMutation<ApiResponse>({
    mutationFn: createProfileRequest,
    onSuccess: (data) => {
      console.log(data);
      router.push('/subscribe');
    },
    onError: (data) => {
      console.log(data);
    },
  });

  useEffect(() => {
    if (isLoaded && isSignedIn && !isPending) {
      mutate();
    }
  }, [isLoaded, isSignedIn]);

  return <div className="pt-24">Processing sign in ...</div>;
};

export default CreateProfilePage;
