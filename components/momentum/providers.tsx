'use client'

import { useEffect, type ReactNode } from 'react'
import { WorkspaceProvider, useWorkspace } from '@/hooks/use-workspace'
import { FocusProvider, useFocusControls } from '@/hooks/use-focus'
import { InterfaceProvider } from '@/hooks/use-interface'
import { Toaster } from '@/components/ui/sonner'
import type { Workspace } from '@/lib/momentum/types'
import { WorkspaceDialogs } from './workspace-dialogs'
import { AppShell } from './app-shell'

function SessionExitGuard() {
  const { hasChanges } = useWorkspace()
  const { status } = useFocusControls()
  const shouldWarn = hasChanges || status === 'running' || status === 'paused'

  useEffect(() => {
    if (!shouldWarn) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [shouldWarn])

  return null
}

export function Providers({ children, initialWorkspace }: { children: ReactNode; initialWorkspace: Workspace }) {
  return <WorkspaceProvider initialWorkspace={initialWorkspace}><FocusProvider><SessionExitGuard /><InterfaceProvider><AppShell>{children}</AppShell><WorkspaceDialogs /><Toaster theme="dark" position="bottom-right" richColors /></InterfaceProvider></FocusProvider></WorkspaceProvider>
}
