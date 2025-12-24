/**
 * MappingEditor Component
 *
 * AIDEV-NOTE: Properties panel for editing selected mapping(s).
 * Shows read-only info when multiple mappings are selected.
 * Shows editable fields when a single mapping is selected.
 *
 * Sections:
 * - Command (name, category, assignment)
 * - Control (type, interaction mode)
 * - MIDI Binding (note/CC, channel)
 * - Conditions (condition 1 & 2)
 * - Comment
 */

import type { Mapping } from '@cmdr/core';
import {
  getConditionDescription,
  getControlTypeName,
  getInteractionModeName,
  getTargetDeckName,
} from '@cmdr/core';
import { Info, Music2, Settings2, StickyNote, Zap } from 'lucide-react';

import { cn } from '../../lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface MappingEditorProps {
  /** Selected mappings */
  mappings: Mapping[];
  /** Callback when a mapping property changes */
  onChange?: (mappingId: number, property: string, value: unknown) => void;
  /** Callback to start MIDI learn */
  onMidiLearn?: (mappingId: number) => void;
}

// ============================================================================
// Section Components
// ============================================================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

function Section({ title, icon, children, className }: SectionProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
        {icon}
        {title}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

function Field({ label, value, className }: FieldProps) {
  return (
    <div className={cn('flex items-center justify-between text-sm', className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// MappingEditor Component
// ============================================================================

export function MappingEditor({
  mappings,
  // onChange, // AIDEV-TODO: Implement editing functionality
  onMidiLearn,
}: MappingEditorProps) {
  // No selection
  if (mappings.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
        <Info className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Select a mapping to view properties
        </p>
      </div>
    );
  }

  // Multiple selection - show summary
  if (mappings.length > 1) {
    return (
      <div className="space-y-4 p-4">
        <div className="rounded-md bg-muted/50 p-3 text-center">
          <p className="text-sm font-medium">
            {mappings.length} mappings selected
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Select a single mapping to edit its properties
          </p>
        </div>

        {/* Summary of selected mappings */}
        <Section
          title="Summary"
          icon={<Info className="h-3 w-3" />}
        >
          <div className="space-y-1 text-xs">
            {mappings.slice(0, 5).map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded bg-muted/30 px-2 py-1"
              >
                <span className="truncate">{m.commandName}</span>
                <span className="font-mono text-muted-foreground">
                  {m.midiBinding?.note ?? '—'}
                </span>
              </div>
            ))}
            {mappings.length > 5 && (
              <p className="text-center text-muted-foreground">
                and {mappings.length - 5} more...
              </p>
            )}
          </div>
        </Section>
      </div>
    );
  }

  // Single selection - show full editor
  const mapping = mappings[0];
  if (!mapping) return null;

  const condition1 = mapping.condition1;
  const condition2 = mapping.condition2;
  const cond1Desc = condition1 ? getConditionDescription(condition1.id) : null;
  const cond2Desc = condition2 ? getConditionDescription(condition2.id) : null;

  return (
    <div className="space-y-6 p-4">
      {/* Command Section */}
      <Section
        title="Command"
        icon={<Zap className="h-3 w-3" />}
      >
        <Field label="Name" value={mapping.commandName} />
        <Field
          label="Type"
          value={mapping.isInput ? 'Input' : 'Output'}
        />
        <Field
          label="Target"
          value={getTargetDeckName(mapping.target)}
        />
      </Section>

      {/* Control Section */}
      <Section
        title="Control"
        icon={<Settings2 className="h-3 w-3" />}
      >
        <Field
          label="Type"
          value={getControlTypeName(mapping.controlType)}
        />
        <Field
          label="Interaction"
          value={getInteractionModeName(mapping.interactionMode)}
        />
        {mapping.autoRepeat && (
          <Field label="Auto Repeat" value="Yes" />
        )}
        {mapping.invert && (
          <Field label="Invert" value="Yes" />
        )}
        {mapping.softTakeover && (
          <Field label="Soft Takeover" value="Yes" />
        )}
      </Section>

      {/* MIDI Binding Section */}
      <Section
        title="MIDI Binding"
        icon={<Music2 className="h-3 w-3" />}
      >
        {mapping.midiBinding ? (
          <>
            <Field
              label="Note/CC"
              value={
                <span className="font-mono">
                  {mapping.midiBinding.note}
                </span>
              }
            />
            <Field
              label="Channel"
              value={mapping.midiBinding.channel}
            />
            <Field
              label="Type"
              value={mapping.midiBinding.isCC ? 'Control Change' : 'Note'}
            />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No MIDI binding</p>
        )}
        <button
          type="button"
          className="mt-2 w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm hover:bg-accent"
          onClick={() => onMidiLearn?.(mapping.id)}
        >
          MIDI Learn
        </button>
      </Section>

      {/* Conditions Section */}
      <Section
        title="Conditions"
        icon={<Info className="h-3 w-3" />}
      >
        {condition1 ? (
          <div className="rounded bg-muted/30 p-2 text-xs">
            <div className="font-medium">
              {cond1Desc?.name ?? `Condition ${condition1.id}`}
            </div>
            <div className="text-muted-foreground">
              Target: {getTargetDeckName(condition1.target)}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No condition 1</p>
        )}

        {condition2 ? (
          <div className="rounded bg-muted/30 p-2 text-xs">
            <div className="font-medium">
              {cond2Desc?.name ?? `Condition ${condition2.id}`}
            </div>
            <div className="text-muted-foreground">
              Target: {getTargetDeckName(condition2.target)}
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">No condition 2</p>
        )}
      </Section>

      {/* Comment Section */}
      <Section
        title="Comment"
        icon={<StickyNote className="h-3 w-3" />}
      >
        {mapping.comment ? (
          <p className="text-sm">{mapping.comment}</p>
        ) : (
          <p className="text-sm text-muted-foreground">No comment</p>
        )}
      </Section>
    </div>
  );
}

export default MappingEditor;
