/**
 * Admin Dashboard Unified Design System
 * Defines consistent colors, spacing, typography, and layout constants
 * Matching the ALMS official identity: Deep Navy (#0B1F3A), White, Light Gray (#F3F5F8), Government Gold (#D4AF37)
 */

// Official ALMS Government Brand Palette
export const ALMSBrandColors = {
    navy: '#0B1F3A',
    navyDark: '#071526',
    navyLight: '#15325B',
    gold: '#D4AF37',
    goldDark: '#B89628',
    goldLight: '#E6C65C',
    surface: '#F3F5F8',
    white: '#FFFFFF',
    border: '#E2E8F0',
};

// Theme Color Palette
export const AdminColors = {
    // Light Mode
    light: {
        background: '#ffffff',
        surface: '#F3F5F8',
        border: '#e2e8f0',
        text: {
            primary: '#0B1F3A',
            secondary: '#475569',
            tertiary: '#94a3b8',
            muted: '#cbd5e1',
        },
        status: {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6',
        },
        hover: '#f1f5f9',
        active: '#e2e8f0',
        disabled: '#d1d5db',
    },

    // Dark Mode
    dark: {
        background: '#0B1F3A',
        surface: '#15325B',
        border: '#1e3a8a',
        text: {
            primary: '#ffffff',
            secondary: '#cbd5e1',
            tertiary: '#94a3b8',
            muted: '#64748b',
        },
        status: {
            success: '#34d399',
            error: '#f87171',
            warning: '#fbbf24',
            info: '#60a5fa',
        },
        hover: '#1e3a8a',
        active: '#2563eb',
        disabled: '#475569',
    },
};

// Spacing System (based on 4px grid)
export const AdminSpacing = {
    xs: '4px',
    sm: '8px',
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
            fontSize: '13px',
        },
        md: {
            height: '38px',
            padding: '8px 16px',
            fontSize: '14px',
        },
        lg: {
            height: '44px',
            padding: '10px 20px',
            fontSize: '15px',
        },
    },
    input: {
        height: '38px',
        padding: '8px 12px',
        fontSize: '14px',
    },
    table: {
        rowHeight: '40px',
        headerHeight: '44px',
        cellPadding: '8px 12px',
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
        height: '56px',
        padding: AdminSpacing.lg,
        gap: AdminSpacing.md,
    },

    // Sidebar
    sidebar: {
        width: '240px',
        collapsedWidth: '64px',
    },

    // Main Content
    content: {
        maxWidth: '1920px',
        padding: AdminSpacing['2xl'],
        gap: AdminSpacing.xl,
    },

    // Cards
    card: {
        padding: AdminSpacing.lg,
        borderRadius: AdminBorderRadius.xl,
        gap: AdminSpacing.md,
    },

    // Modals
    modal: {
        borderRadius: AdminBorderRadius.xl,
        maxWidth: '600px',
        padding: AdminSpacing['2xl'],
    },

    // Tables
    table: {
        borderRadius: AdminBorderRadius.lg,
        padding: AdminSpacing.md,
    },
};

// Filter/Search
export const AdminFilters = {
    containerPadding: AdminSpacing.md,
    containerGap: AdminSpacing.md,
    inputHeight: '38px',
    borderRadius: AdminBorderRadius.md,
};
