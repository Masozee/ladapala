// Icon wrapper components using HugeiconsIcon from @hugeicons/react
import { HugeiconsIcon, HugeiconsProps } from '@hugeicons/react';
import {
  Building03Icon as HugeBuilding03,
  UserMultiple02Icon as HugeUserMultiple02,
  HeadphonesIcon as HugeHeadphones,
  HotelIcon as HugeHotel,
  Calendar01Icon as HugeCalendar01,
  CreditCardIcon as HugeCreditCard,
  File01Icon as HugeFile01,
  Settings02Icon as HugeSettings02,
  UserCheckIcon as HugeUserCheck,
  BedIcon as HugeBed,
  DoorIcon as HugeDoor,
  PackageIcon as HugePackage,
  UserSettings01Icon as HugeUserSettings01,
  Time01Icon as HugeTime01,
  ArrowUp01Icon as HugeArrowUp01,
  ArrowDown01Icon as HugeArrowDown01,
  QuestionIcon as HugeQuestion,
  Wrench01Icon as HugeWrench01,
  Shield01Icon as HugeShield01,
  Home01Icon as HugeHome01,
  UserIcon as HugeUser,
  ArrowRight01Icon as HugeArrowRight01,
  Search02Icon as HugeSearch02,
  Cancel01Icon as HugeCancel01,
  Location01Icon as HugeLocation01,
  Notification02Icon as HugeNotification02,
  Sun03Icon as HugeSun03,
  Moon02Icon as HugeMoon02,
  Loading03Icon as HugeLoading03,
  News01Icon as HugeNews01,
  Alert01Icon as HugeAlert01,
  PieChartIcon as HugePieChart,
  Clock01Icon as HugeClock01,
  FilterIcon as HugeFilter,
  ViewIcon as HugeView,
  EyeIcon as HugeEye,
  PencilEdit02Icon as HugePencilEdit02,
  Call02Icon as HugeCall02,
  Mail01Icon as HugeMail01,
  Add01Icon as HugeAdd01,
  UserMultipleIcon as HugeUserMultiple,
  SparklesIcon as HugeSparkles,
  CancelCircleIcon as HugeCancelCircle,
  AlertCircleIcon as HugeAlertCircle,
  ListViewIcon as HugeListView,
  Menu01Icon as HugeMenu01,
  MoreHorizontalIcon as HugeMoreHorizontal,
  Logout01Icon as HugeLogout01,
  CancelSquareIcon as HugeCancelSquare,
  Delete02Icon as HugeDelete02,
  ComputerIcon as HugeComputer,
  Activity02Icon as HugeActivity02,
  CpuIcon as HugeCpu,
  DatabaseIcon as HugeDatabase,
  HardDriveIcon as HugeHardDrive,
  PrinterIcon as HugePrinter,
  CircleArrowReload01Icon as HugeCircleArrowReload01,
  Image02Icon as HugeImage02,
  Archive03Icon as HugeArchive03,
  ClipboardIcon as HugeClipboard,
  CheckmarkCircle02Icon as HugeCheckmarkCircle02,
  PlayIcon as HugePlay,
} from '@hugeicons/core-free-icons';
import React from 'react';

// Create wrapper components that use HugeiconsIcon with stroke width 3
const createIconComponent = (iconData: any) => {
  return React.forwardRef<SVGSVGElement, Omit<HugeiconsProps, 'icon'>>((props, ref) => (
    <HugeiconsIcon {...props} icon={iconData} strokeWidth={2} ref={ref} />
  ));
};

export const Building03Icon = createIconComponent(HugeBuilding03);
export const UserMultiple02Icon = createIconComponent(HugeUserMultiple02);
export const HeadphonesIcon = createIconComponent(HugeHeadphones);
export const HotelIcon = createIconComponent(HugeHotel);
export const Calendar01Icon = createIconComponent(HugeCalendar01);
export const CreditCardIcon = createIconComponent(HugeCreditCard);
export const File01Icon = createIconComponent(HugeFile01);
export const Settings02Icon = createIconComponent(HugeSettings02);
export const UserCheckIcon = createIconComponent(HugeUserCheck);
export const BedIcon = createIconComponent(HugeBed);
export const Door01Icon = createIconComponent(HugeDoor);
export const PackageIcon = createIconComponent(HugePackage);
export const UserSettings01Icon = createIconComponent(HugeUserSettings01);
export const Time01Icon = createIconComponent(HugeTime01);
export const ArrowUp01Icon = createIconComponent(HugeArrowUp01);
export const ArrowDown01Icon = createIconComponent(HugeArrowDown01);
export const QuestionIcon = createIconComponent(HugeQuestion);
export const Wrench01Icon = createIconComponent(HugeWrench01);
export const Shield01Icon = createIconComponent(HugeShield01);
export const Home01Icon = createIconComponent(HugeHome01);
export const UserIcon = createIconComponent(HugeUser);
export const ArrowRight01Icon = createIconComponent(HugeArrowRight01);
export const Search02Icon = createIconComponent(HugeSearch02);
export const Cancel01Icon = createIconComponent(HugeCancel01);
export const Location01Icon = createIconComponent(HugeLocation01);
export const Notification02Icon = createIconComponent(HugeNotification02);
export const Sun03Icon = createIconComponent(HugeSun03);
export const Moon02Icon = createIconComponent(HugeMoon02);
export const Loading03Icon = createIconComponent(HugeLoading03);
export const News01Icon = createIconComponent(HugeNews01);
export const Alert01Icon = createIconComponent(HugeAlert01);
export const PieChartIcon = createIconComponent(HugePieChart);
export const Clock01Icon = createIconComponent(HugeClock01);
export const FilterIcon = createIconComponent(HugeFilter);
export const ViewIcon = createIconComponent(HugeView);
export const EyeIcon = createIconComponent(HugeEye);
export const PencilEdit02Icon = createIconComponent(HugePencilEdit02);
export const Call02Icon = createIconComponent(HugeCall02);
export const Mail01Icon = createIconComponent(HugeMail01);
export const Add01Icon = createIconComponent(HugeAdd01);
export const UserMultipleIcon = createIconComponent(HugeUserMultiple);
export const SparklesIcon = createIconComponent(HugeSparkles);
export const CancelCircleIcon = createIconComponent(HugeCancelCircle);
export const AlertCircleIcon = createIconComponent(HugeAlertCircle);
export const ListViewIcon = createIconComponent(HugeListView);
export const Menu01Icon = createIconComponent(HugeMenu01);
export const MoreHorizontalIcon = createIconComponent(HugeMoreHorizontal);
export const Logout01Icon = createIconComponent(HugeLogout01);
export const CancelSquareIcon = createIconComponent(HugeCancelSquare);
export const Delete02Icon = createIconComponent(HugeDelete02);
export const ComputerIcon = createIconComponent(HugeComputer);
export const Activity02Icon = createIconComponent(HugeActivity02);
export const CpuIcon = createIconComponent(HugeCpu);
export const DatabaseIcon = createIconComponent(HugeDatabase);
export const HardDriveIcon = createIconComponent(HugeHardDrive);
export const PrinterIcon = createIconComponent(HugePrinter);
export const CircleArrowReload01Icon = createIconComponent(HugeCircleArrowReload01);
export const Image02Icon = createIconComponent(HugeImage02);
export const Archive03Icon = createIconComponent(HugeArchive03);

// Aliases for compatibility
export const Trash2 = Delete02Icon;
export const Printer = PrinterIcon;
export const Monitor = ComputerIcon;
export const Activity = Activity02Icon;
export const Cpu = CpuIcon;
export const Server = DatabaseIcon; // Using Database icon as Server alternative
export const HardDrive = HardDriveIcon;

// Chevron icons using Arrow icons as alternatives (chevrons not in free package)
export const ChevronUpIcon = createIconComponent(HugeArrowUp01);
export const ChevronDownIcon = createIconComponent(HugeArrowUp01); // Rotate in CSS if needed
export const ChevronLeftIcon = createIconComponent(HugeArrowRight01); // Rotate in CSS if needed
export const ChevronRightIcon = createIconComponent(HugeArrowRight01);

// TrendingUpIcon using ArrowUp as alternative (trending icons not in free package)
export const TrendingUpIcon = ArrowUp01Icon;

// Aliases for common icon names
export const ArrowRightIcon = ArrowRight01Icon;
export const FileTextIcon = File01Icon;
export const TruckDeliveryIcon = PackageIcon; // Using Package as truck delivery alternative

// Set display names for debugging
Building03Icon.displayName = 'Building03Icon';
UserMultiple02Icon.displayName = 'UserMultiple02Icon';
HeadphonesIcon.displayName = 'HeadphonesIcon';
HotelIcon.displayName = 'HotelIcon';
Calendar01Icon.displayName = 'Calendar01Icon';
CreditCardIcon.displayName = 'CreditCardIcon';
File01Icon.displayName = 'File01Icon';
Settings02Icon.displayName = 'Settings02Icon';
UserCheckIcon.displayName = 'UserCheckIcon';
BedIcon.displayName = 'BedIcon';
Door01Icon.displayName = 'Door01Icon';
PackageIcon.displayName = 'PackageIcon';
UserSettings01Icon.displayName = 'UserSettings01Icon';
Time01Icon.displayName = 'Time01Icon';
ArrowUp01Icon.displayName = 'ArrowUp01Icon';
ArrowDown01Icon.displayName = 'ArrowDown01Icon';
QuestionIcon.displayName = 'QuestionIcon';
Wrench01Icon.displayName = 'Wrench01Icon';
Shield01Icon.displayName = 'Shield01Icon';
Home01Icon.displayName = 'Home01Icon';
UserIcon.displayName = 'UserIcon';
ArrowRight01Icon.displayName = 'ArrowRight01Icon';
Search02Icon.displayName = 'Search02Icon';
Cancel01Icon.displayName = 'Cancel01Icon';
Location01Icon.displayName = 'Location01Icon';
Notification02Icon.displayName = 'Notification02Icon';
Sun03Icon.displayName = 'Sun03Icon';
Moon02Icon.displayName = 'Moon02Icon';
Loading03Icon.displayName = 'Loading03Icon';
News01Icon.displayName = 'News01Icon';
Alert01Icon.displayName = 'Alert01Icon';
PieChartIcon.displayName = 'PieChartIcon';
Clock01Icon.displayName = 'Clock01Icon';
FilterIcon.displayName = 'FilterIcon';
ViewIcon.displayName = 'ViewIcon';
EyeIcon.displayName = 'EyeIcon';
PencilEdit02Icon.displayName = 'PencilEdit02Icon';
Call02Icon.displayName = 'Call02Icon';
Mail01Icon.displayName = 'Mail01Icon';
Add01Icon.displayName = 'Add01Icon';
UserMultipleIcon.displayName = 'UserMultipleIcon';
SparklesIcon.displayName = 'SparklesIcon';
CancelCircleIcon.displayName = 'CancelCircleIcon';
AlertCircleIcon.displayName = 'AlertCircleIcon';
ListViewIcon.displayName = 'ListViewIcon';
Menu01Icon.displayName = 'Menu01Icon';
MoreHorizontalIcon.displayName = 'MoreHorizontalIcon';
ChevronUpIcon.displayName = 'ChevronUpIcon';
ChevronDownIcon.displayName = 'ChevronDownIcon';
ChevronLeftIcon.displayName = 'ChevronLeftIcon';
ChevronRightIcon.displayName = 'ChevronRightIcon';
Logout01Icon.displayName = 'Logout01Icon';
CancelSquareIcon.displayName = 'CancelSquareIcon';
Delete02Icon.displayName = 'Delete02Icon';
ComputerIcon.displayName = 'ComputerIcon';
Activity02Icon.displayName = 'Activity02Icon';
CpuIcon.displayName = 'CpuIcon';
DatabaseIcon.displayName = 'DatabaseIcon';
HardDriveIcon.displayName = 'HardDriveIcon';
PrinterIcon.displayName = 'PrinterIcon';
CircleArrowReload01Icon.displayName = 'CircleArrowReload01Icon';
Image02Icon.displayName = 'Image02Icon';
Archive03Icon.displayName = 'Archive03Icon';
Trash2.displayName = 'Trash2';
Printer.displayName = 'Printer';
Monitor.displayName = 'Monitor';
Activity.displayName = 'Activity';
Cpu.displayName = 'Cpu';
Server.displayName = 'Server';
HardDrive.displayName = 'HardDrive';

export const ClipboardCheckIcon = createIconComponent(HugeClipboard);
ClipboardCheckIcon.displayName = 'ClipboardCheckIcon';

export const CheckmarkCircle02Icon = createIconComponent(HugeCheckmarkCircle02);
CheckmarkCircle02Icon.displayName = 'CheckmarkCircle02Icon';

export const PlayIcon = createIconComponent(HugePlay);
PlayIcon.displayName = 'PlayIcon';
