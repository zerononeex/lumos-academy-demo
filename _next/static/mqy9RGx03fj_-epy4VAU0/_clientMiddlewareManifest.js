self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/lumos-academy-demo(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!_next\\/static|_next\\/image|games\\/|icons\\/|worlds\\/|art\\/|sw\\.js|offline\\.html|manifest\\.webmanifest).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!_next/static|_next/image|games/|icons/|worlds/|art/|sw\\.js|offline\\.html|manifest\\.webmanifest).*)"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()