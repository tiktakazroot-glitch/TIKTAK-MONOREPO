/**
 * Category Types — Shared API Contract
 * ════════════════════════════════════════════════════════════════
 * These are the OUTPUT types — the shape of data the API *returns* to clients.
 * The mapper bridges CategoryDbRecord (from schema.ts) → these types.
 *
 * Input types (what clients SEND) live in Category.schemas.ts (Zod).
 * ════════════════════════════════════════════════════════════════
 */

/** JSONB shape for localized text fields (matches schema.ts category columns) */
export type LocalizedText = { az?: string; ru?: string; en?: string };

export namespace Category {
    // ═══════════════════════════════════════════════════════════════
    // API OUTPUT VIEWS
    // ═══════════════════════════════════════════════════════════════

    /** Public access — what unauthenticated users see */
    export interface PublicAccess {
        id: string;
        title: LocalizedText;
        description?: LocalizedText;
        parentId?: string | null;
        icon?: string | null;
        isActive: boolean | null;
        [key: string]: unknown;
    }

    /** Tree view — hierarchical structure for category navigation */
    export interface Tree extends PublicAccess {
        children?: Tree[];
    }

    /** Private access — what staff/admin users see */
    export interface PrivateAccess extends PublicAccess {
        createdAt: Date | null;
        updatedAt?: Date | null;
        hasOptions?: boolean | null;
        type?: string | null;
        parent?: {
            id: string;
            title: LocalizedText;
        } | null;
    }

    // ═══════════════════════════════════════════════════════════════
    // FILTER / OPTION TYPES (used in card creation UI)
    // ═══════════════════════════════════════════════════════════════

    export interface FilterOption {
        id: string;
        title: LocalizedText | string;
        [key: string]: unknown;
    }

    export interface Filter {
        id: string;
        title?: LocalizedText | string;
        type: string;
        options?: unknown[];
        category_filter_options?: FilterOption[];
        [key: string]: unknown;
    }

    /** Selected option stored in a card's filtersOptions JSONB */
    export interface SelectedOption {
        filter_id: string;
        type: string;
        filter_option_id: string | null;
        dynamic_value: string | number | null;
    }
}
