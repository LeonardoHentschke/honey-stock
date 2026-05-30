import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { inventoryService } from '../models/inventoryService';
import {
  entrySchema, exitSchema, adjustSchema,
  type EntryValues, type ExitValues, type AdjustValues,
} from '../models/inventorySchemas';
import { batchService } from '@/features/batches/models/batchService';
import { humanizeError } from '@/shared/lib/errors';

type MovementMode = 'entry' | 'exit' | 'adjust';

interface Props {
  variantId: string;
  companyId: string;
  mode: MovementMode;
  onSuccess: () => void;
}

function schemaForMode(mode: MovementMode) {
  if (mode === 'entry') return entrySchema;
  if (mode === 'exit') return exitSchema;
  return adjustSchema;
}

export function useStockMovementViewModel({ variantId, companyId, mode, onSuccess }: Props) {
  const { session } = useAuth();

  const batchesQuery = useQuery({
    queryKey: ['batches', companyId],
    queryFn: () => batchService.list(companyId),
    enabled: mode === 'entry',
    staleTime: 60_000,
  });

  const form = useForm<EntryValues & ExitValues & AdjustValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schemaForMode(mode)) as any,
    defaultValues: {
      quantity: 0,
      new_quantity: 0,
      unit_cost: null,
      batch_id: null,
      notes: null,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: EntryValues & ExitValues & AdjustValues) => {
      const userId = session!.user.id;
      if (mode === 'entry') {
        return inventoryService.createEntry({
          companyId, variantId, userId,
          quantity: values.quantity,
          unitCost: values.unit_cost,
          batchId: values.batch_id,
          notes: values.notes,
        });
      }
      if (mode === 'exit') {
        return inventoryService.createExit({
          companyId, variantId, userId,
          quantity: values.quantity,
          notes: values.notes,
        });
      }
      return inventoryService.createAdjustment({
        companyId, variantId, userId,
        newQuantity: values.new_quantity,
        notes: values.notes,
      });
    },
    onSuccess,
  });

  return {
    control: form.control,
    errors: form.formState.errors,
    batches: batchesQuery.data ?? [],
    isSubmitting: mutation.isPending,
    submitError: mutation.error ? humanizeError(mutation.error) : null,
    submit: form.handleSubmit((values) => mutation.mutate(values as EntryValues & ExitValues & AdjustValues)),
    clearError: () => mutation.reset(),
  };
}
