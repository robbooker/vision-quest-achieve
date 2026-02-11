

# Set Global QueryClient staleTime Default

A one-line change in `src/App.tsx` to configure the `QueryClient` with a global default `staleTime` of 30 seconds.

## What Changes

In `src/App.tsx`, the current QueryClient initialization:

```typescript
const queryClient = new QueryClient();
```

Will be updated to:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
    },
  },
});
```

This prevents unnecessary background refetches when components remount within 30 seconds of the last fetch, reducing network traffic without risking stale data. All existing `useQuery` hooks inherit this default automatically unless they specify their own `staleTime`.

