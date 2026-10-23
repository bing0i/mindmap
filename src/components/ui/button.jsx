import React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const variants = cva('btn', { variants: { variant: { default: 'btn-default', secondary: 'btn-secondary', ghost: 'btn-ghost', outline: 'btn-outline' }, size: { default: 'btn-md', sm: 'btn-sm', icon: 'btn-icon' } }, defaultVariants: { variant: 'default', size: 'default' } })
export function Button({ className, variant, size, asChild=false, ...props }) { const Comp=asChild?Slot:'button'; return <Comp className={cn(variants({variant,size}),className)} {...props}/> }
