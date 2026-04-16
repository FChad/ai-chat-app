const sidebarMobileOpen = ref(false)

export function useSidebar() {
    const sidebarOpen = useCookie<boolean>('sidebar:open', {
        default: () => true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
    })

    const isMobile = ref(false)

    if (import.meta.client) {
        const checkMobile = () => {
            isMobile.value = window.innerWidth < 768
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
    }

    const toggle = () => {
        if (isMobile.value) {
            sidebarMobileOpen.value = !sidebarMobileOpen.value
        } else {
            sidebarOpen.value = !sidebarOpen.value
        }
    }

    return {
        isOpen: sidebarOpen,
        isMobileOpen: sidebarMobileOpen,
        isMobile,
        toggle,
    }
}
