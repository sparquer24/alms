export type Variant = 'danger' | 'warning' | 'info';

export const getVariantStyles = (variant: Variant) => {
  switch (variant) {
    case 'danger':
      return {
        // icon is provided as a className hint; components should render the actual SVG
        iconClass: 'text-red-600',
        confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        iconBg: 'bg-red-100'
      };
    case 'warning':
      return {
        iconClass: 'text-yellow-600',
        confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
        iconBg: 'bg-yellow-100'
      };
    default:
      return {
        iconClass: 'text-blue-600',
        confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        iconBg: 'bg-blue-100'
      };
  }
};
