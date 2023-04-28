import { INavData } from './gp-sidebar-nav';

export const navItemsMainMenu: INavData[] = [
  {
    title: true,
    label: 'APP.MENU.Dashboard',
    path: 'dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    permission: 'DASHBOARD',
    attributes: { disabled: false }
  },
  {
    title: true,
    label: 'APP.MENU.Files',
    path: 'files',
    url: '/files',
    icon: 'topic',
    permission: 'FILES',
    attributes: { disabled: false }
  },
  {
    title: true,
    label: 'APP.MENU.Messages',
    path: 'messages',
    url: '/messages',
    iconBs: 'send',
    permission: 'MESSAGES',
    attributes: { disabled: false }
  },
  {
    divider: true,
    label: 'APP.MENU.Empty'
  },
  {
    title: true,
    label: 'APP.MENU.Configurations',
    path: 'placeholders',
    url: '/placeholders',
    iconBs: 'gear',
    permission: 'SETTINGS',
    children: [
      {
        title: true,
        label: 'APP.MENU.Placeholders',
        path: 'placeholders',
        url: '/placeholders',
        iconBs: 'tag',
        permission: 'PLACEHOLDERS',
        attributes: { disabled: false }
      },
      {
        title: true,
        label: 'APP.MENU.Templates',
        path: 'templates',
        url: '/templates',
        iconBs: 'tag',
        permission: 'TEMPLATES',
        attributes: { disabled: false }
      },
      {
        title: true,
        label: 'APP.MENU.ServiceInstances',
        path: 'service-instances',
        url: '/service-instances',
        icon: 'apps',
        permission: 'SERVICES',
        attributes: { disabled: false }
      }
    ]
  }
];
