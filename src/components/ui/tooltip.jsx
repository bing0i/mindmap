import React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
export const TooltipProvider=TooltipPrimitive.Provider
export function Tooltip({children,label}) { return <TooltipPrimitive.Root><TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger><TooltipPrimitive.Portal><TooltipPrimitive.Content className="tooltip" sideOffset={8}>{label}<TooltipPrimitive.Arrow className="tooltip-arrow"/></TooltipPrimitive.Content></TooltipPrimitive.Portal></TooltipPrimitive.Root> }
