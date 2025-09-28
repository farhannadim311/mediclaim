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
import { BOARD_COLORS, BOARD_DISPLAY_NAMES } from './constants';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HtmlContent } from '@/components/ui/html-content';
import { Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';


export type ReportsSectionProps = {
  /** Optional list of board ids to include. If empty/undefined, show all. */
  filterBoards?: number[];
  /** Max number of reports to display. Defaults to 6. */
  limit?: number;
};

type ReportItem = {
  id: string;
  board: number;
  title: string;
  shortDescription: string;
  metadata: string;
};

export const ReportsSection: React.FC<Readonly<ReportsSectionProps>> = ({ filterBoards, limit = 6 }) => {
  const boardApiProvider = useDeployedBoardContext();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const deployments$ = boardApiProvider.boardDeployments$;
    const sub = deployments$.subscribe((arr) => {
      if (arr.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }
      const inner = arr[0].subscribe((deployment) => {
        if (deployment.status === 'deployed') {
          const stateSub = deployment.api.state$.subscribe({
            next: (state) => {
              try {
                const nextReports: ReportItem[] = [];
                for (const [id, board] of state.reportBoard) {
                  const title = state.reportTitle.lookup(id);
                  const shortDescription = state.reportShortDescription.lookup(id);
                  const metadata = state.reportMetadata.lookup(id);
                  nextReports.push({
                    id: id.toString(),
                    board,
                    title,
                    shortDescription,
                    metadata,
                  });
                }
                // Sort by numeric id desc so newest first (if ids are increasing)
                nextReports.sort((a, b) => BigInt(b.id) > BigInt(a.id) ? 1 : -1);
                setReports(nextReports);
                setLoading(false);
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Failed to parse reports');
                setLoading(false);
              }
            },
            error: () => {
              setError('Failed to load board state');
              setLoading(false);
            },
          });
          return () => stateSub.unsubscribe();
        }
        if (deployment.status === 'failed') {
          setError('Failed to connect to board. Make sure you are running Lace Midnight Wallet extension and you\'re on a Web3 compatible browser. Also, your wallet should be initialized and connected to the network.');
          setLoading(false);
        }
      });
      return () => inner.unsubscribe();
    });
    return () => sub.unsubscribe();
  }, [boardApiProvider]);

  const filteredReports = useMemo(() => {
    if (!filterBoards || filterBoards.length === 0) return reports;
    const allowed = new Set<number>(filterBoards);
    return reports.filter((r) => allowed.has(Number(r.board)));
  }, [reports, filterBoards]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4">
        <Alert className="bg-white/6 text-white border-white/12">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="py-4 text-center">
        <h6 className="text-gray-400 mb-2">No reports yet</h6>
        <p className="text-gray-500">Be the first to share important information</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {filteredReports.length === 0 ? (
        <div className="py-4 text-center">
          <h6 className="text-gray-400 mb-2">No reports match the selected filters</h6>
          <p className="text-gray-500">Try clearing filters to see all reports</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredReports.map((report) => (
          <Link key={report.id} to={`/report/${report.id}`} className="block group">
            <Card className="bg-white/8 border-white/12 group-hover:bg-white/12 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-orange-500/20 transition-all duration-300 h-full">
              <CardContent className="p-5 flex flex-col h-full">
                <div className="flex items-center mb-3">
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                    style={{ backgroundColor: BOARD_COLORS[report.board] || '#666' }}
                  >
                    {BOARD_DISPLAY_NAMES[report.board] || `Board ${report.board}`}
                  </span>
                </div>
                <h6 className="text-white mb-3 font-semibold text-lg leading-tight group-hover:text-orange-300 transition-colors duration-200">
                 <HtmlContent 
                    content={report.title}
                    asPlainText={true}
                    maxLines={1}
                    className="text-white"
                  />
                </h6>
                <div className="flex-grow">
                  <HtmlContent 
                    content={report.shortDescription}
                    asPlainText={true}
                    maxLines={3}
                    className="text-gray-400 leading-relaxed"
                  />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
        </div>
      )}
    </div>
  );
};

export default ReportsSection;
