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

import React, { useEffect, useState } from 'react';
import { useDeployedBoardContext } from '../../hooks';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DawnLogo } from './Logo';
import { LogOut, Wallet } from 'lucide-react';

/**
 * A simple application level header for the bulletin board application.
 */
export const Header: React.FC = () => {
  const api = useDeployedBoardContext();
  const [walletInfo, setWalletInfo] = useState<{ coinPublicKey: string } | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    const sub = api.wallet$.subscribe((w) => {
      setWalletInfo(w);
    });
    return () => sub.unsubscribe();
  }, [api]);

  const handleDisconnect = () => {
    window.localStorage.removeItem('lace-wallet-mode');
    api.disconnect().then(() => {
      // Reload the page to reset wallet connection state
      window.location.reload();
    });
  };

  return (
  <>
    <header
      data-testid="header"
      className="bg-black/20 max-w-[1100px] mx-auto backdrop-blur-md border-b border-white/10 flex md:items-center justify-between p-3 z-50 flex flex-col md:flex-row gap-5 md:gap-0"
    >
      <Link to="/">
        <DawnLogo />
      </Link>

      <div className="flex items-center gap-2 px-10">
        {walletInfo ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2">
              <Wallet className="w-4 h-4 text-green-400" />
              <span className="text-white text-sm font-medium">
                {`${walletInfo.coinPublicKey.slice(0, 6)}...${walletInfo.coinPublicKey.slice(-4)}`}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-400/50 text-red-400 hover:bg-foreground hover:text-red-400"
              onClick={handleDisconnect}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            className="bg-white text-black hover:bg-white/90"
            onClick={() => {
              void api.connect();
            }}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        )}
        
        <Button
          className="bg-orange-500 text-black hover:bg-orange-400"
          onClick={() => navigate('/claims')}
        >
          Verify Claims
        </Button>
        
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
          onClick={() => navigate('/attestation')}
        >
          Get Attestation
        </Button>
        
        <Button
          variant="outline"
          className="border-white/20 text-white hover:bg-white/10"
          onClick={() => navigate('/policies')}
        >
          Policies
        </Button>
      </div>

    </header>
  
    </>
  );
};
