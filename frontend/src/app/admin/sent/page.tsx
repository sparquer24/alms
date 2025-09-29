"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function SentRedirect(){
  const router = useRouter();
  useEffect(()=>{ router.replace('/admin/home?type=sent'); },[router]);
  return null;
}
