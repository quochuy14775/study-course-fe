import {CheckCircle, Flame, Leaf, TrendingUp, XCircle} from "lucide-react";

export const LevelOptions = [
    {value: '0', label: 'Beginner', icon: Leaf, iconClass: 'text-green-500'},
    {value: '1', label: 'Intermediate', icon: TrendingUp, iconClass: 'text-yellow-500'},
    {value: '2', label: 'Advanced', icon: Flame, iconClass: 'text-red-500'},
];
export const StatusOptions = [
    { value: 'true', label: 'Active', icon: CheckCircle, iconClass: 'text-green-500' },
    { value: 'false', label: 'Inactive', icon: XCircle, iconClass: 'text-red-500' },
]
