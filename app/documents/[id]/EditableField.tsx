interface EditableFieldProps {
    label: string;
    value: any;
    editing: boolean;
    onChange: (value: any) => void;
    type?: 'text' | 'number' | 'textarea' | 'boolean';
}

// Sanitize input to prevent XSS (A03: Injection)
function sanitizeInput(input: string): string {
    if (!input) return input;
    // Remove potentially dangerous characters
    return input
        .replace(/[<>]/g, '') // Remove < and >
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers like onclick=
        .trim();
}

export default function EditableField({ label, value, editing, onChange, type = 'text' }: EditableFieldProps) {
    const displayValue = value || '-';

    if (!editing) {
        if (type === 'boolean') {
            return <>{value ? 'Sí' : value === false ? 'No' : '-'}</>;
        }
        if (type === 'textarea') {
            return <span className="whitespace-pre-wrap">{displayValue}</span>;
        }
        return <>{displayValue}</>;
    }

    if (type === 'boolean') {
        return (
            <select
                value={value === null ? '' : value ? 'true' : 'false'}
                onChange={(e) => onChange(e.target.value === '' ? null : e.target.value === 'true')}
                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
            >
                <option value="">-</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
            </select>
        );
    }

    if (type === 'textarea') {
        return (
            <textarea
                value={value || ''}
                onChange={(e) => onChange(sanitizeInput(e.target.value))}
                rows={3}
                maxLength={5000}
                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
            />
        );
    }

    if (type === 'number') {
        return (
            <input
                type="number"
                value={value || ''}
                onChange={(e) => {
                    const num = e.target.value ? parseInt(e.target.value) : null;
                    // Validate number range
                    if (num !== null && (num < 0 || num > 999999)) return;
                    onChange(num);
                }}
                min="0"
                max="999999"
                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
            />
        );
    }

    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(sanitizeInput(e.target.value))}
            maxLength={500}
            className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
        />
    );
}
