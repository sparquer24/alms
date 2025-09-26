"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function FinalDisposalRedirect(){
  const router = useRouter();
  useEffect(()=>{ router.replace('/admin/home?type=finaldisposal'); },[router]);
  return null;
}
