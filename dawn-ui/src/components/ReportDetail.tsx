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
import { useParams, Link } from 'react-router-dom';
import { useDeployedBoardContext } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HtmlContent } from '@/components/ui/html-content';
import { Loader2, ArrowLeft } from 'lucide-react';
import { BOARD_COLORS, BOARD_DISPLAY_NAMES } from './constants';

type ReportItem = {
  board: number;
  title: string;
  shortDescription: string;
  metadata: string;
};

const ReportDetail: React.FC = () => {
  const { reportId } = useParams();
  const boardApiProvider = useDeployedBoardContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setReport(null);
    const deployments$ = boardApiProvider.boardDeployments$;
    const sub = deployments$.subscribe((arr) => {
      if (arr.length === 0) {
        setError('No board connected');
        setLoading(false);
        return;
      }
      const inner = arr[0].subscribe(async (deployment) => {
        if (deployment.status === 'deployed') {
          try {
            if (!reportId) throw new Error('Missing report id');
            const r = await deployment.api.getReport(BigInt(reportId));
            setReport({
              board: Number(r.board),
              title: r.title,
              shortDescription: r.shortDescription,
              metadata: r.metadata,
            });
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to fetch report');
          } finally {
            setLoading(false);
          }
        }
        if (deployment.status === 'failed') {
          setError('Failed to connect to board. Make sure you are running Lace Midnight Wallet extension and you\'re on a Web3 compatible browser. Also, your wallet should be initialized and connected to the network.');
          setLoading(false);
        }
      });
      return () => inner.unsubscribe();
    });
    return () => sub.unsubscribe();
  }, [boardApiProvider, reportId]);

  return (
    <div className="w-full min-h-screen bg-black text-white">
      <div className="max-w-[1100px] mx-auto px-4 py-6">
        <div className="mb-4">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
          </div>
        )}

        {error && !loading && (
          <Alert className="bg-white/6 text-white border-white/12">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && report && (
          <Card className="bg-gray-800/40 border border-gray-700/30 shadow-xl backdrop-blur-md">
            <CardContent className="p-8">
              <div className="mb-4">
                <span
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium text-white shadow-sm"
                  style={{ backgroundColor: BOARD_COLORS[report.board] || '#666' }}
                >
                  {BOARD_DISPLAY_NAMES[report.board] || `Board ${report.board}`}
                </span>
              </div>
              
              <h1 className="text-3xl font-bold mb-6 text-white leading-tight">
                <HtmlContent 
                  content={report.title}
                  className="text-white"
                />
              </h1>
              
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-white">Summary</h2>
                <HtmlContent 
                  content={report.shortDescription}
                  className="text-gray-300 leading-relaxed"
                />
              </div>

              {report.metadata && (
                <>
                  {(() => {
                    let parsedMetadata: { content: string; footnotes: string } | null = null;
                    try {
                      parsedMetadata = JSON.parse(report.metadata);
                    } catch (e) {
                      // Fall back to legacy format if not JSON
                      return (
                        <div className="mt-8 pt-6 border-t border-gray-700/30">
                          <h2 className="text-xl font-semibold mb-4 text-white">Additional Context</h2>
                          <HtmlContent 
                            content={report.metadata}
                            className="text-gray-300 leading-relaxed"
                          />
                        </div>
                      );
                    }
                    
                    return (
                      <>
                        {parsedMetadata && parsedMetadata.content && parsedMetadata.content.trim() && (
                          <div className="mt-8 pt-6 border-t border-gray-700/30">
                            <h2 className="text-xl font-semibold mb-4 text-white">Main Content</h2>
                            <HtmlContent 
                              content={parsedMetadata.content}
                              className="text-gray-300 leading-relaxed"
                            />
                          </div>
                        )}
                        
                        {parsedMetadata && parsedMetadata.footnotes && parsedMetadata.footnotes.trim() && (
                          <div className="mt-8 pt-6 border-t border-gray-700/30">
                            <h2 className="text-xl font-semibold mb-4 text-white">References & Additional Context</h2>
                            <HtmlContent 
                              content={parsedMetadata.footnotes}
                              className="text-gray-300 leading-relaxed"
                            />
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ReportDetail;


