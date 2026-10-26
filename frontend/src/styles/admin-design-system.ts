/**
 * Admin Dashboard Unified Design System
 * Defines consistent colors, spacing, typography, and layout constants
 */

// Color Palette
export const AdminColors = {
    // Light Mode
    light: {
        background: '#ffffff',
        surface: '#f8f9fa',
        border: '#e0e0e0',
        text: {
            primary: '#1a1a1a',
            secondary: '#666666',
            tertiary: '#999999',
            muted: '#cccccc',
        },
        status: {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
        },
        hover: '#f3f4f6',
        active: '#e5e7eb',
        disabled: '#d1d5db',
    },

    // Dark Mode
    dark: {
        background: '#1a1a1a',
        surface: '#2d2d2d',
        border: '#404040',
        text: {
            primary: '#ffffff',
            secondary: '#b3b3b3',
            tertiary: '#808080',
            muted: '#595959',
        },
        status: {
            success: '#34d399',
            error: '#f87171',
            warning: '#fbbf24',
            info: '#60a5fa',
        },
        hover: '#3d3d3d',
        active: '#4d4d4d',
        disabled: '#525252',
    },
};

// Spacing System (based on 4px grid)
export const AdminSpacing = {
    xs: '4px',
    sm: '16px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
};

// Border Radius
export const AdminBorderRadius = {
    none: '0px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
};

// Shadows
export const AdminShadows = {
    none: 'none',
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
};

// Component Sizes
export const AdminComponentSizes = {
    button: {
        sm: {
            height: '32px',
            padding: '6px 12px',
            fontSize: '14px',
        },
        md: {
            height: '40px',
            padding: '10px 16px',
            fontSize: '14px',
        },
        lg: {
            height: '48px',
            padding: '12px 20px',
            fontSize: '16px',
        },
    },
    input: {
        height: '40px',
        padding: '10px 12px',
        fontSize: '14px',
    },
    table: {
        rowHeight: '48px',
        headerHeight: '48px',
        cellPadding: '12px 16px',
    },
};

// Z-Index Scale
export const AdminZIndex = {
    hide: -1,
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    fixed: 1200,
    modal: 1300,
    popover: 1400,
    tooltip: 1500,
};

// Layout
export const AdminLayout = {
    // Header Toolbar
    header: {
        height: '64px',
        padding: AdminSpacing.lg,
        gap: AdminSpacing.md,
    },

    // Sidebar
    sidebar: {
        width: '280px',
        collapsedWidth: '80px',
    },

    // Main Content
    content: {
        maxWidth: '1920px',
        padding: AdminSpacing['3xl'],
        gap: AdminSpacing['2xl'],
    },

    // Cards
    card: {
        padding: AdminSpacing.xl,
        borderRadius: AdminBorderRadius.lg,
        gap: AdminSpacing.md,
    },

    // Modals
    modal: {
        borderRadius: AdminBorderRadius.lg,
        maxWidth: '600px',
        padding: AdminSpacing['2xl'],
    },

    // Tables
    table: {
        borderRadius: AdminBorderRadius.lg,
        padding: AdminSpacing.lg,
    },
};

// Filter/Search
export const AdminFilters = {
    containerPadding: AdminSpacing.lg,
    containerGap: AdminSpacing.md,
    inputHeight: '40px',
    borderRadius: AdminBorderRadius.md,
};

