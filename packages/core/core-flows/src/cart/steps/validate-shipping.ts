import {
  CartLineItemDTO,
  CartWorkflowDTO,
  ProductVariantDTO,
  ShippingOptionDTO,
} from "@medusajs/types"
import { createStep, StepResponse } from "@medusajs/workflows-sdk"

import { MedusaError } from "../../../../utils/dist/common"

export type ValidateShippingInput = {
  cart: Omit<CartWorkflowDTO, "items"> & {
    items: (CartLineItemDTO & {
      variant: ProductVariantDTO
    })[]
  }
  shippingOptions: ShippingOptionDTO[]
}

export const validateShippingStepId = "validate-shipping"
/**
 * This step validates shipping data when cart is completed.
 *
 * It ensures that a shipping method is selected if there is an item in the cart that requires shipping.
 * It also ensures that product's shipping profile mathes the selected shipping options.
 */
export const validateShippingStep = createStep(
  validateShippingStepId,
  async (data: ValidateShippingInput) => {
    const { cart, shippingOptions } = data

    const optionProfileMap: Map<string, string> = new Map(
      shippingOptions.map((option) => [option.id, option.shipping_profile_id])
    )

    const cartItemsWithShipping =
      cart.items?.filter((item) => item.requires_shipping) || []

    const cartShippingMethods = cart.shipping_methods || []

    if (cartItemsWithShipping.length > 0 && cartShippingMethods.length === 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No shipping method selected but the cart contains items that require shipping."
      )
    }

    const requiredShippingPorfiles = cartItemsWithShipping.map(
      (item) => (item.variant.product as any)?.shipping_profile?.id
    )

    const availableShippingPorfiles = cartShippingMethods.map((method) =>
      optionProfileMap.get(method.shipping_option_id!)
    )

    const missingShippingPorfiles = requiredShippingPorfiles.filter(
      (profile) => !availableShippingPorfiles.includes(profile)
    )

    if (missingShippingPorfiles.length > 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The cart items require shipping profiles that are not satisfied by the current shipping methods"
      )
    }

    return new StepResponse(void 0)
  }
)
