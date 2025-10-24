/**
 * Centralized icon exports for the Resto app
 * All icons are wrapped from @hugeicons/react with consistent styling
 * ALWAYS import from this file, NEVER directly from @hugeicons packages
 */

import React from 'react';
import { HugeiconsIcon, HugeiconsProps } from '@hugeicons/react';
import {
  DollarCircleIcon as HugeDollarCircle,
  AnalyticsUpIcon as HugeAnalyticsUp,
  AnalyticsDownIcon as HugeAnalyticsDown,
  Download01Icon as HugeDownload01,
  FilterIcon as HugeFilter,
  Analytics01Icon as HugeAnalytics01,
  ArrowUp01Icon as HugeArrowUp01,
  ArrowDown01Icon as HugeArrowDown01,
  ShoppingCart01Icon as HugeShoppingCart01,
  ViewIcon as HugeView,
} from '@hugeicons/core-free-icons';

// Helper function to create icon components with consistent props
const createIconComponent = (iconData: any) => {
  return React.forwardRef<SVGSVGElement, Omit<HugeiconsProps, 'icon'>>((props, ref) => (
    <HugeiconsIcon {...props} icon={iconData} strokeWidth={2} ref={ref} />
  ));
};

// Export wrapped icons
export const DollarCircleIcon = createIconComponent(HugeDollarCircle);
DollarCircleIcon.displayName = 'DollarCircleIcon';

export const AnalyticsUpIcon = createIconComponent(HugeAnalyticsUp);
AnalyticsUpIcon.displayName = 'AnalyticsUpIcon';

export const AnalyticsDownIcon = createIconComponent(HugeAnalyticsDown);
AnalyticsDownIcon.displayName = 'AnalyticsDownIcon';

export const Download01Icon = createIconComponent(HugeDownload01);
Download01Icon.displayName = 'Download01Icon';

export const FilterIcon = createIconComponent(HugeFilter);
FilterIcon.displayName = 'FilterIcon';

export const Analytics01Icon = createIconComponent(HugeAnalytics01);
Analytics01Icon.displayName = 'Analytics01Icon';

export const ArrowUp01Icon = createIconComponent(HugeArrowUp01);
ArrowUp01Icon.displayName = 'ArrowUp01Icon';

export const ArrowDown01Icon = createIconComponent(HugeArrowDown01);
ArrowDown01Icon.displayName = 'ArrowDown01Icon';

export const ShoppingCart01Icon = createIconComponent(HugeShoppingCart01);
ShoppingCart01Icon.displayName = 'ShoppingCart01Icon';

export const ViewIcon = createIconComponent(HugeView);
ViewIcon.displayName = 'ViewIcon';
