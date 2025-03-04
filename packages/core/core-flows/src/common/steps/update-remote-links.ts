import { Link } from "@medusajs/framework/modules-sdk"
import { LinkDefinition } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const updateRemoteLinksStepId = "update-remote-links-step"
/**
 * This step updates remote links between two records of linked data models.
 *
 * Learn more in the [Remote Link documentation.](https://docs.medusajs.com/learn/fundamentals/module-links/remote-link#create-link).
 *
 * @example
 * const data = updateRemoteLinksStep([
 *   {
 *     [Modules.PRODUCT]: {
 *       product_id: "prod_321",
 *     },
 *     "helloModuleService": {
 *       my_custom_id: "mc_321",
 *     },
 *     data: {
 *       metadata: {
 *         test: false
 *       }
 *     }
 *   }
 * ])
 */
export const updateRemoteLinksStep = createStep(
  updateRemoteLinksStepId,
  async (data: LinkDefinition[], { container }) => {
    if (!data?.length) {
      return new StepResponse([], [])
    }

    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)

    // Fetch all existing links and throw an error if any weren't found
    const dataBeforeUpdate = (await link.list(data, {
      asLinkDefinition: true,
    })) as LinkDefinition[]

    const unequal = dataBeforeUpdate.length !== data.length

    if (unequal) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Could not find all existing links from data`
      )
    }

    // link.create here performs an upsert. By performing validation above, we can ensure
    // that this method will always perform an update in these cases
    await link.create(data)

    return new StepResponse(data, dataBeforeUpdate)
  },
  async (dataBeforeUpdate, { container }) => {
    if (!dataBeforeUpdate?.length) {
      return
    }

    const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)

    await link.create(dataBeforeUpdate)
  }
)
