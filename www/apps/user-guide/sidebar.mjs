import { sidebarAttachHrefCommonOptions } from "build-scripts"

// TODO check the order of items based on the Medusa Admin's sidebar

/** @type {import('types').RawSidebarItemType[]} */
export const sidebar = sidebarAttachHrefCommonOptions([
  {
    type: "link",
    path: "/",
    title: "Introduction",
  },
  {
    type: "separator",
  },
  {
    type: "category",
    title: "Tips",
    autogenerate_path: "/tips",
  },
  {
    type: "category",
    title: "Orders",
    children: [
      {
        type: "link",
        title: "Overview",
        path: "/orders",
      },
      {
        type: "link",
        title: "Manage Details",
        path: "/orders/manage",
      },
      {
        type: "link",
        title: "Manage Payments",
        path: "/orders/payments",
      },
      {
        type: "link",
        title: "Manage Fulfillments",
        path: "/orders/fulfillments",
      },
      {
        type: "link",
        title: "Edit Order Items",
        path: "/orders/edit",
      },
      {
        type: "link",
        title: "Manage Returns",
        path: "/orders/returns",
      },
      {
        type: "link",
        title: "Manage Exchanges",
        path: "/orders/exchanges",
      },
      {
        type: "link",
        title: "Manage Claims",
        path: "/orders/claims",
      },
    ],
  },
  {
    type: "category",
    path: "/products",
    title: "Products",
    autogenerate_path: "/products",
  },
  {
    type: "category",
    path: "/inventory",
    title: "Inventory",
    autogenerate_path: "/inventory",
  },
  {
    type: "category",
    path: "/customers",
    title: "Customers",
    autogenerate_path: "/customers",
  },
  {
    type: "category",
    path: "/discounts",
    title: "Discounts",
    autogenerate_path: "/discounts",
  },
  {
    type: "category",
    path: "/pricing",
    title: "Pricing",
    autogenerate_path: "/pricing",
  },
  {
    type: "category",
    path: "/settings",
    title: "Settings",
    autogenerate_path: "/settings",
  },
])
