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

import React, { useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/compact-runtime';
import { Button } from '@/components/ui/button';
import { Plus, PlusCircle, Link } from 'lucide-react';
import { TextPromptDialog } from './TextPromptDialog';

/**
 * The props required by the {@link EmptyCardContent} component.
 *
 * @internal
 */
export interface EmptyCardContentProps {
  /** A callback that will be called to create a new bulletin board. */
  onCreateBoardCallback: () => void;
  /** A callback that will be called to join an existing bulletin board. */
  onJoinBoardCallback: (contractAddress: ContractAddress) => void;
}

/**
 * Used when there is no board deployment to render a UI allowing the user to join or deploy bulletin boards.
 *
 * @internal
 */
export const EmptyCardContent: React.FC<Readonly<EmptyCardContentProps>> = ({
  onCreateBoardCallback,
  onJoinBoardCallback,
}) => {
  const [textPromptOpen, setTextPromptOpen] = useState(false);

  return (
    <React.Fragment>
      <div className="p-6">
        <div className="text-center mb-4">
          <Plus className="h-12 w-12 text-primary mx-auto mb-2" />
          <p data-testid="board-posted-message" className="text-primary text-sm">
            Create a new Board, or join an existing one...
          </p>
        </div>
      </div>
      <div className="flex justify-center gap-2 pb-4">
        <Button
          size="sm"
          variant="ghost"
          data-testid="board-deploy-btn"
          onClick={onCreateBoardCallback}
          title="Create a new board"
          className="h-8 w-8 p-0"
        >
          <PlusCircle className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          data-testid="board-join-btn"
          onClick={() => {
            setTextPromptOpen(true);
          }}
          title="Join an existing board"
          className="h-8 w-8 p-0"
        >
          <Link className="h-4 w-4" />
        </Button>
      </div>
      <TextPromptDialog
        prompt="Enter contract address"
        isOpen={textPromptOpen}
        onCancel={() => {
          setTextPromptOpen(false);
        }}
        onSubmit={(text) => {
          setTextPromptOpen(false);
          onJoinBoardCallback(text);
        }}
      />
    </React.Fragment>
  );
};
