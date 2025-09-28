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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * The props required by the {@link TextPromptDialog} component.
 */
export interface TextPromptDialogProps {
  /** The prompt to display to the user. */
  prompt: string;
  /** `true` to render the dialog opened; otherwise closed. */
  isOpen: boolean;
  /** A callback that will be called if the user cancels the dialog. */
  onCancel: () => void;
  /** A callback that will be called when the user submits their inputted data. */
  onSubmit: (text: string) => void;
}

/**
 * A simple modal dialog that prompts the user for a single piece of textual data.
 */
export const TextPromptDialog: React.FC<Readonly<TextPromptDialogProps>> = ({ prompt, isOpen, onCancel, onSubmit }) => {
  const [text, setText] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-medium text-black mb-4" data-testid="textprompt-dialog-title">
          {prompt}
        </h3>
        <div className="mb-6">
          <Input
            id="text-prompt"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoComplete="off"
            className="w-full"
            data-testid="textprompt-dialog-text-prompt"
            autoFocus
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button 
            variant="outline" 
            data-testid="textprompt-dialog-cancel-btn" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            data-testid="textprompt-dialog-ok-btn"
            disabled={!text.length}
            onClick={() => {
              onSubmit(text);
            }}
            type="submit"
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
};
