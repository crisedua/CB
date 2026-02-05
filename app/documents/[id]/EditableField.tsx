interface EditableFieldProps {
    label: string;
    value: any;
    editing: boolean;
    onChange: (value: any) => void;
    type?: 'text' | 'number' | 'textarea' | 'boolean';
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
                onChange={(e) => onChange(e.target.value)}
                rows={3}
                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
            />
        );
    }

    if (type === 'number') {
        return (
            <input
                type="number"
                value={value || ''}
                onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
            />
        );
    }

    return (
        <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full px-2 py-1 border rounded dark:bg-neutral-700 dark:border-neutral-600"
        />
    );
}
