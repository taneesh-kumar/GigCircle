import React from 'react';
import type { DisputeStatus } from '@/types/dispute';
import { Badge } from '@/components/ui/badge';

interface DisputeStatusBadgeProps {
  status: DisputeStatus;
}

export const DisputeStatusBadge: React.FC<DisputeStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/25 border-yellow-500/30">Open</Badge>;
    case 'UNDER_REVIEW':
      return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 hover:bg-blue-500/25 border-blue-500/30">Under Review</Badge>;
    case 'ACTION_REQUIRED':
      return <Badge className="bg-orange-500/15 text-orange-700 dark:text-orange-400 hover:bg-orange-500/25 border-orange-500/30">Action Required</Badge>;
    case 'RESOLVED':
      return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 border-emerald-500/30">Resolved</Badge>;
    case 'DISMISSED':
      return <Badge className="bg-gray-500/15 text-gray-700 dark:text-gray-400 hover:bg-gray-500/25 border-gray-500/30">Dismissed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
