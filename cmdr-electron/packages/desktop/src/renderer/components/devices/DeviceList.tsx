/**
 * DeviceList Component
 *
 * AIDEV-NOTE: Displays the list of devices in the current TSI file.
 * Supports selection, context menu, and device info display.
 *
 * Features:
 * - Click to select device
 * - Right-click context menu (rename, duplicate, delete)
 * - Shows device type and mapping count
 * - Keyboard navigation (arrow keys)
 */

import type { Device } from '@cmdr/core';
import { getDeviceTypeName } from '@cmdr/core';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Keyboard,
  MoreVertical,
  Music2,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';

import { cn } from '../../lib/utils';
import { useTsiStore } from '../../store/tsiStore';

// ============================================================================
// Types
// ============================================================================

export interface DeviceListProps {
  /** List of devices to display */
  devices: Device[];
  /** Currently selected device index */
  selectedIndex: number | null;
  /** File ID for store operations */
  fileId: string;
  /** Callback when device is selected */
  onSelect?: (index: number) => void;
  /** Callback when device is renamed */
  onRename?: (index: number, newName: string) => void;
  /** Callback when device is duplicated */
  onDuplicate?: (index: number) => void;
  /** Callback when device is deleted */
  onDelete?: (index: number) => void;
}

// ============================================================================
// DeviceListItem Component
// ============================================================================

interface DeviceListItemProps {
  device: Device;
  isSelected: boolean;
  onSelect: () => void;
  onRename?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

function DeviceListItem({
  device,
  isSelected,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: DeviceListItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const deviceName = getDeviceTypeName(device.deviceType);
  const isKeyboard = device.isKeyboard;
  const mappingCount = device.mappingCount;

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setShowMenu(true);
    },
    []
  );

  const handleMenuAction = useCallback(
    (action: 'rename' | 'duplicate' | 'delete') => {
      setShowMenu(false);
      switch (action) {
        case 'rename':
          onRename?.();
          break;
        case 'duplicate':
          onDuplicate?.();
          break;
        case 'delete':
          onDelete?.();
          break;
      }
    },
    [onRename, onDuplicate, onDelete]
  );

  return (
    <div className="relative">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground'
        )}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onSelect();
          }
        }}
      >
        {/* Expand/Collapse toggle */}
        <button
          type="button"
          className="flex h-4 w-4 items-center justify-center rounded hover:bg-accent-foreground/10"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* Device icon */}
        {isKeyboard ? (
          <Keyboard className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Music2 className="h-4 w-4 text-muted-foreground" />
        )}

        {/* Device info */}
        <div className="flex-1 truncate">
          <div className="font-medium">{deviceName}</div>
          {isExpanded && (
            <div className="text-xs text-muted-foreground">
              {mappingCount} mapping{mappingCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Menu button */}
        <button
          type="button"
          className={cn(
            'flex h-6 w-6 items-center justify-center rounded opacity-0 transition-opacity hover:bg-accent-foreground/10',
            'group-hover:opacity-100',
            showMenu && 'opacity-100'
          )}
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </button>

      {/* Context Menu Dropdown */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-transparent"
            onClick={() => setShowMenu(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowMenu(false);
            }}
            aria-label="Close menu"
          />
          <div className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-border bg-popover p-1 shadow-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => handleMenuAction('rename')}
            >
              <Pencil className="h-4 w-4" />
              Rename
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => handleMenuAction('duplicate')}
            >
              <Copy className="h-4 w-4" />
              Duplicate
            </button>
            <div className="my-1 h-px bg-border" />
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              onClick={() => handleMenuAction('delete')}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// DeviceList Component
// ============================================================================

export function DeviceList({
  devices,
  selectedIndex,
  fileId,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
}: DeviceListProps) {
  const selectDevice = useTsiStore((s) => s.selectDevice);

  const handleSelect = useCallback(
    (index: number) => {
      selectDevice(fileId, index);
      onSelect?.(index);
    },
    [fileId, selectDevice, onSelect]
  );

  if (devices.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No devices
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {devices.map((device, index) => (
        <DeviceListItem
          key={device.id}
          device={device}
          isSelected={selectedIndex === index}
          onSelect={() => handleSelect(index)}
          onRename={() => onRename?.(index, device.deviceType)}
          onDuplicate={() => onDuplicate?.(index)}
          onDelete={() => onDelete?.(index)}
        />
      ))}
    </div>
  );
}

export default DeviceList;
