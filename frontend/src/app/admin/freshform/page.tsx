"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function FreshFormRedirect(){
  const router = useRouter();
  useEffect(()=>{ router.replace('/admin/home?type=freshform'); },[router]);
  return null;
}
