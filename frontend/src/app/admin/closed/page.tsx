"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ClosedRedirect(){
  const router = useRouter();
  useEffect(()=>{ router.replace('/admin/home?type=closed'); },[router]);
  return null;
}
