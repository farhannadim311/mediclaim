// This file is part of midnightntwrk/example-counter.
// Copyright (C) 2025 Midnight Foundation
// SPDX-License-Identifier: Apache-2.0
// Licensed under the Apache License, Version 2.0 (the "License");
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useEffect, useMemo, useState } from 'react';
import { useDeployedBoardContext } from '../hooks';
import { type BoardDeployment } from '../contexts';
import { type DeployeddawnAPI } from '../../../api/src/index';
import { BOARD_DISPLAY_NAMES } from './constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TiptapEditor } from '@/components/ui/tiptap-editor';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Loader2 } from 'lucide-react';
import { initWitnesses } from '../../../contract/src';
import { useNavigate } from 'react-router-dom';

type AttestationGrant = {
  domainHash: string; // 0x-hex32
  boardsMask: number; // uint32
  expiryDays: number; // YYYYMMDD
  sigR8x: string; // 0x-hex32
  sigR8y: string; // 0x-hex32
  sigS: string; // 0x-hex32
  boardsGranted?: number[];
};

type StoredAttestation = {
  grant: AttestationGrant;
  storedAtMs: number;
};

const STORAGE_KEY = 'dawn.attestation';


/** Current date as YYYYMMDD */
function todayYYYYMMDD(): bigint {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return BigInt(`${y}${m}${day}`);
}

function hexToBytes32(hex: string): Uint8Array {
  if (!hex) {
    throw new Error('Hex string is empty or undefined');
  }

  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;

  // Ensure we have exactly 64 characters (32 bytes)
  if (clean.length !== 64) {
    throw new Error(`Expected 64 hex characters (32 bytes), got ${clean.length}`);
  }

  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    const hexByte = clean.slice(i * 2, (i * 2) + 2);
    bytes[i] = parseInt(hexByte, 16);
    if (isNaN(bytes[i])) {
      throw new Error(`Invalid hex byte: ${hexByte} at position ${i}`);
    }
  }

  return bytes;
}


const isBoardAllowedByMask = (mask: number, board: number): boolean => {
  if (board < 0 || board > 63) return false;
  const bit = 1 << board;
  // mask is number (up to 32-bit here), so safe for first 31 boards
  return (mask & bit) === bit;
};

export const NewReport: React.FC = () => {
  const boardApiProvider = useDeployedBoardContext();
  const [deployment, setDeployment] = useState<BoardDeployment | undefined>(undefined);
  const [api, setApi] = useState<DeployeddawnAPI | undefined>(undefined);

  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [attestation, setAttestation] = useState<AttestationGrant | undefined>(undefined);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [info, setInfo] = useState<string | undefined>(undefined);

  const [board, setBoard] = useState<number>(0);
  const [title, setTitle] = useState<string>('');
  const [shortDescription, setShortDescription] = useState<string>('');
  const [metadata, setMetadata] = useState<{content: string; footnotes: string} | string>({ content: '', footnotes: '' });
  const [submitting, setSubmitting] = useState(false);

  const attestationBaseUrl = useMemo(() => {
    return (import.meta.env.VITE_ATTESTATION_URL as string);
  }, []);

  // Load any stored attestation
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as StoredAttestation;
      // If server-side expiryDays is still in the future, keep it
      const today = todayYYYYMMDD();
      if (BigInt(parsed.grant.expiryDays) >= today) {
        setAttestation(parsed.grant);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  // Acquire first deployed API
  useEffect(() => {
    const deployments$ = boardApiProvider.boardDeployments$;
    const sub = deployments$.subscribe((arr) => {
      if (arr.length === 0) return;
      const inner = arr[0].subscribe((d) => {
        setDeployment(d);
        if (d.status === 'deployed') setApi(d.api);
      });
      return () => inner.unsubscribe();
    });
    return () => sub.unsubscribe();
  }, [boardApiProvider]);

  const handleSendOtp = async (): Promise<void> => {
    setError(undefined);
    setInfo(undefined);
    if (!email || !email.includes('@')) {
      setError('Enter a valid email');
      return;
    }
    try {
      setSendingOtp(true);
      const res = await fetch(`${attestationBaseUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to send OTP');
      }
      setInfo('OTP sent. Check your inbox.');
    } catch (e: any) {
      setError(e?.message ?? 'Failed to send OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async (): Promise<void> => {
    setError(undefined);
    setInfo(undefined);
    if (!email || !otp) {
      setError('Email and OTP required');
      return;
    }
    try {
      setVerifying(true);
      const res = await fetch(`${attestationBaseUrl}/attestate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, proof: { code: otp } }),
      });
      const body = (await res.json()) as AttestationGrant & { error?: string };
      if (!res.ok || (body as any).error) {
        throw new Error((body as any).error || 'Failed to verify OTP');
      }
      setAttestation(body);
      const toStore: StoredAttestation = { grant: body, storedAtMs: Date.now() };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
      setInfo('Attestation granted for 24h. You can now submit a report.');
      // Prefill board if granted list exists
      if (Array.isArray(body.boardsGranted) && body.boardsGranted.length > 0) {
        setBoard(body.boardsGranted[0]);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to verify OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleClearAttestation = (): void => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAttestation(undefined);
  };

  const router = useNavigate();
  const handleSubmitReport = async (): Promise<void> => {
    setError(undefined);
    setInfo(undefined);

    if (!api) {
      setError('Connect wallet before submitting a report.');
      return;
    }
    if (!attestation) {
      setError('Attestation required');
      return;
    }
    // Helper function to extract text from HTML content
    const getTextContent = (html: string): string => {
      const div = document.createElement('div');
      div.innerHTML = html;
      return div.textContent || div.innerText || '';
    };

    const titleText = title.trim();
    const summaryText = getTextContent(shortDescription).trim();
    
    if (!titleText || !summaryText) {
      setError('Title and summary required');
      return;
    }
    if (!isBoardAllowedByMask(attestation.boardsMask, board)) {
      setError('Selected category not permitted by your attestation');
      return;
    }

    try {
      setSubmitting(true);
      const domainHash = hexToBytes32(attestation.domainHash);
      const boardsMask = BigInt(attestation.boardsMask);
      const expiryDays = BigInt(attestation.expiryDays);
      const sigR8x = hexToBytes32(attestation.sigR8x);
      const sigR8y = hexToBytes32(attestation.sigR8y);
      const sigS = hexToBytes32(attestation.sigS);
      const todayDays = todayYYYYMMDD();

      // Format metadata as JSON.stringify({ content, footnotes })
      const formattedMetadata = typeof metadata === 'string' 
        ? metadata 
        : JSON.stringify({ 
            content: metadata.content || '', 
            footnotes: metadata.footnotes || '' 
          });
      
      await api.postReportWithAttestation(
        board,
        title,
        shortDescription,
        formattedMetadata,
        domainHash,
        boardsMask,
        expiryDays,
        sigR8x,
        sigR8y,
        sigS,
        todayDays,
      );

      setInfo('Report submitted successfully.');
      setTitle('');
      setShortDescription('');
      setMetadata({ content: '', footnotes: '' });

      // clear attestation
      // window.localStorage.removeItem(STORAGE_KEY);
      // setAttestation(undefined);

      // navigate to landing page
      router('/');
    } catch (e: any) {
      console.error(e);
      setError(e?.message ?? 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBoards = useMemo(() => {
    return !attestation ? [] : Object.entries(BOARD_DISPLAY_NAMES)
      .sort(([a], [b]) => {
        const aAllowed = isBoardAllowedByMask(attestation.boardsMask, Number(a));
        const bAllowed = isBoardAllowedByMask(attestation.boardsMask, Number(b));
        if (aAllowed && !bAllowed) return -1;
        if (!aAllowed && bAllowed) return 1;
        return 0;
      });
  }, [attestation]);

  useEffect(() => {
    if(filteredBoards.length  && filteredBoards.length > 0) {
      setBoard(Number(filteredBoards[0][0]));
    }
  }, [filteredBoards]);

  return (
    <div className="w-full mb-20 max-w-[1100px] mx-auto text-white mt-10 py-4 px-3">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3 text-white">
          File a New Report
        </h1>
        <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
          We use zero-knowledge attestations to prevent abuse. Your identity remains private while ensuring report authenticity.
        </p>
      </div>

      {error && (
        <Alert className="mb-3 bg-red-500/10 text-red-100 border-red-500/30 shadow-lg">
          <AlertDescription className="text-red-100">{error}</AlertDescription>
        </Alert>
      )}
      {info && (
        <Alert className="mb-3 bg-green-500/10 text-green-100 border-green-500/30 shadow-lg">
          <AlertDescription className="text-green-100">{info}</AlertDescription>
        </Alert>
      )}

      {/* Step 1: Email and OTP */}
      {!attestation && (
        <Card className="bg-gray-800/40 border border-gray-700/30 mb-4 shadow-xl backdrop-blur-md">
          <CardContent className="p-6">
            <h6 className="mb-3 font-semibold text-white text-lg">
              Step 1: Verify your email
            </h6>
            <div className="flex gap-3 flex-wrap items-end">
              <div className="flex-1 min-w-[320px]">
                <Label htmlFor="email" className="text-gray-300 font-medium mb-1 block">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-700/50 border-gray-600/30 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50"
                />
              </div>
              <Button
                disabled={sendingOtp || !email}
                onClick={handleSendOtp}
                className="from-orange-400 to-amber-500 bg-gradient-to-r text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {sendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send OTP'}
              </Button>
            </div>

            <div className="flex gap-3 items-end mt-4">
              <div className="min-w-[180px]">
                <Label htmlFor="otp" className="text-gray-300 font-medium mb-1 block">OTP</Label>
                <Input
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="bg-gray-700/50 border-gray-600/30 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50"
                />
              </div>
              <Button
                variant="outline"
                disabled={verifying || !otp}
                onClick={handleVerifyOtp}
                className="border border-orange-400/40 text-white hover:text-black from-orange-400 to-amber-500 bg-gradient-to-r hover:opacity-95 disabled:text-black disabled:cursor-not-allowed shadow-lg"
              >
                {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Grant'}
              </Button>
            </div>

            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Attestations last for 24 hours. We do not store your email.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Report details */}
      {attestation && (
        <Card className="bg-gray-800/40 border border-gray-700/30 shadow-xl backdrop-blur-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h6 className="font-semibold text-white text-lg">
                Step 2: Compose your report
              </h6>
              <Button size="sm" variant="ghost" onClick={handleClearAttestation} className="text-gray-400 hover:text-white hover:bg-gray-700/30">
                Clear attestation
              </Button>
            </div>

            <div className="min-w-[260px] mb-6">
              <Label htmlFor="board-select" className="text-gray-300 font-medium mb-2 block">Category</Label>
              <Select value={board.toString()} onValueChange={(value) => setBoard(Number(value))}>
                <SelectTrigger className="bg-gray-700/50 border border-orange-500/30 text-white hover:bg-gray-700/60 focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600/30 shadow-xl">
                  {
                    filteredBoards.map(([id, name]) => {
                      const isAllowed = isBoardAllowedByMask(attestation.boardsMask, Number(id));
                      return (
                        <SelectItem
                          key={id}
                          value={id}
                          disabled={!isAllowed}
                          className={`text-white hover:bg-gray-700/50 data-[highlighted]:bg-gray-700/50 data-[highlighted]:text-white data-[disabled]:text-gray-500 data-[disabled]:opacity-50 ${isAllowed ? 'text-white' : 'text-gray-500'
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-green-400' : 'bg-gray-500'}`}></span>
                            {name}
                          </span>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="mb-6">
              <Label htmlFor="title" className="text-gray-300 font-medium mb-2 block text-lg">Title</Label>
              <p className="text-sm text-gray-400 mb-3">Give your report a clear, descriptive title</p>
              <TiptapEditor
                content={title}
                onChange={setTitle}
                placeholder="Enter report title..."
                minHeight="48px"
                maxHeight="48px"
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="content" className="text-gray-300 font-medium mb-2 block text-lg">Report</Label>
              <p className="text-sm text-gray-400 mb-3">Drop all details of your report. You can use formatting, lists, links, and other rich text to describe your drop. Your identity stays private, and no one can censor what you share</p>
              <RichTextEditor
                content={typeof metadata === 'string' ? '' : metadata.content || ""}
                onChange={(content) => setMetadata(prev => {
                  const footnotes = typeof prev === 'string' ? '' : prev.footnotes || "";
                  return { content, footnotes };
                })}
                placeholder="Provide the main content of your report..."
                minHeight="300px"
                maxHeight="900px"
                showToolbar={true}
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="footnotes" className="text-gray-300 font-medium mb-2 block text-lg">References & Additional Context (optional)</Label>
              <p className="text-sm text-gray-400 mb-3">Add links, references, supporting evidence, or footnotes related to your report</p>
              <RichTextEditor
                content={typeof metadata === 'string' ? '' : metadata.footnotes || ""}
                onChange={(footnotes) => setMetadata(prev => {
                  const content = typeof prev === 'string' ? '' : prev.content || "";
                  return { content, footnotes };
                })}
                placeholder="Add links, references, supporting evidence, or additional context..."
                minHeight="150px"
                maxHeight="350px"
                showToolbar={true}
              />
            </div>

            <div className="mb-6">
              <Label htmlFor="summary" className="text-gray-300 font-medium mb-2 block text-lg">Summary</Label>
              <p className="text-sm text-gray-400 mb-3">Concise short summary of your report</p>
              <TiptapEditor
                content={shortDescription}
                onChange={setShortDescription}
                placeholder="Enter report title..."
                // singleLine={true}
                minHeight="200px"
                maxHeight="200px"
              />
            </div>

            <div className="flex gap-3 items-center">
              <Button
                disabled={submitting}
                onClick={handleSubmitReport}
                className="from-orange-400 to-amber-500 bg-gradient-to-r text-black hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg px-6"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit Report'}
              </Button>
              {deployment?.status === 'in-progress' && (
                <p className="text-sm text-gray-300 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting to board...
                </p>
              )}
              {deployment?.status === 'failed' && (
                <p className="text-sm text-red-300">
                  Failed to connect to boardx
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Your attestation expires on ⏳ {(() => {
                const dateStr = attestation.expiryDays.toString();
                const year = dateStr.slice(0, 4);
                const month = dateStr.slice(4, 6);
                const day = dateStr.slice(6, 8);
                return `${year}-${month}-${day}`;
              })()}.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewReport;


