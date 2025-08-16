interface GlobalState {
  user: {
    id: string | null
    profile: any | null
    preferences: any
    isAuthenticated: boolean
  }
  employees: {
    list: any[]
    selected: any | null
    loading: boolean
    lastUpdated: string | null
  }
  payroll: {
    payslips: any[]
    currentPeriod: string | null
    processing: boolean
    lastUpdated: string | null
  }
  leave: {
    requests: any[]
    balance: any | null
    loading: boolean
    lastUpdated: string | null
  }
  notifications: {
    items: any[]
    unreadCount: number
    lastUpdated: string | null
  }
  sync: {
    status: "idle" | "syncing" | "error" | "offline"
    lastSync: string | null
    pendingChanges: any[]
    conflicts: any[]
  }
  ui: {
    theme: "light" | "dark" | "system"
    language: string
    platform: "web" | "mobile"
  }
}

type GlobalAction =
  | { type: "SET_USER"; payload: any }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; payload: any }
  | { type: "SET_EMPLOYEES"; payload: any[] }
  | { type: "ADD_EMPLOYEE"; payload: any }
  | { type: "UPDATE_EMPLOYEE"; payload: { id: string; data: any } }
  | { type: "DELETE_EMPLOYEE"; payload: string }
  | { type: "SET_PAYSLIPS"; payload: any[] }
  | { type: "ADD_PAYSLIP"; payload: any }
  | { type: "SET_LEAVE_REQUESTS"; payload: any[] }
  | { type: "ADD_LEAVE_REQUEST"; payload: any }
  | { type: "UPDATE_LEAVE_REQUEST"; payload: { id: string; data: any } }
  | { type: "SET_LEAVE_BALANCE"; payload: any }
  | { type: "ADD_NOTIFICATION"; payload: any }
  | { type: "MARK_NOTIFICATION_READ"; payload: string }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "SET_SYNC_STATUS"; payload: GlobalState["sync"]["status"] }
  | { type: "ADD_PENDING_CHANGE"; payload: any }
  | { type: "CLEAR_PENDING_CHANGES" }
  | { type: "ADD_CONFLICT"; payload: any }
  | { type: "RESOLVE_CONFLICT"; payload: string }
  | { type: "SET_THEME"; payload: GlobalState["ui"]["theme"] }
  | { type: "SET_LANGUAGE"; payload: string }
  | { type: "HYDRATE_STATE"; payload: Partial<GlobalState> }

const initialState: GlobalState = {
  user: {
    id: null,
    profile: null,
    preferences: {},
    isAuthenticated: false,
  },
  employees: {
    list: [],
    selected: null,
    loading: false,
    lastUpdated: null,
  },
  payroll: {
    payslips: [],
    currentPeriod: null,
    processing: false,
    lastUpdated: null,
  },
  leave: {
    requests: [],
    balance: null,
    loading: false,
    lastUpdated: null,
  },
  notifications: {
    items: [],
    unreadCount: 0,
    lastUpdated: null,
  },
  sync: {
    status: "idle",
    lastSync: null,
    pendingChanges: [],
    conflicts: [],
  },
  ui: {
    theme: "system",
    language: "en",
    platform: "web",
  },
}

export function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
          isAuthenticated: true,
        },
      }

    case "LOGOUT":
      return {
        ...initialState,
        ui: state.ui, // Preserve UI settings
      }

    case "UPDATE_PROFILE":
      return {
        ...state,
        user: {
          ...state.user,
          profile: { ...state.user.profile, ...action.payload },
        },
      }

    case "SET_EMPLOYEES":
      return {
        ...state,
        employees: {
          ...state.employees,
          list: action.payload,
          loading: false,
          lastUpdated: new Date().toISOString(),
        },
      }

    case "ADD_EMPLOYEE":
      return {
        ...state,
        employees: {
          ...state.employees,
          list: [...state.employees.list, action.payload],
          lastUpdated: new Date().toISOString(),
        },
      }

    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: {
          ...state.employees,
          list: state.employees.list.map((emp) =>
            emp.id === action.payload.id ? { ...emp, ...action.payload.data } : emp,
          ),
          lastUpdated: new Date().toISOString(),
        },
      }

    case "DELETE_EMPLOYEE":
      return {
        ...state,
        employees: {
          ...state.employees,
          list: state.employees.list.filter((emp) => emp.id !== action.payload),
          lastUpdated: new Date().toISOString(),
        },
      }

    case "SET_PAYSLIPS":
      return {
        ...state,
        payroll: {
          ...state.payroll,
          payslips: action.payload,
          lastUpdated: new Date().toISOString(),
        },
      }

    case "ADD_PAYSLIP":
      return {
        ...state,
        payroll: {
          ...state.payroll,
          payslips: [action.payload, ...state.payroll.payslips],
          lastUpdated: new Date().toISOString(),
        },
      }

    case "SET_LEAVE_REQUESTS":
      return {
        ...state,
        leave: {
          ...state.leave,
          requests: action.payload,
          loading: false,
          lastUpdated: new Date().toISOString(),
        },
      }

    case "ADD_LEAVE_REQUEST":
      return {
        ...state,
        leave: {
          ...state.leave,
          requests: [action.payload, ...state.leave.requests],
          lastUpdated: new Date().toISOString(),
        },
      }

    case "UPDATE_LEAVE_REQUEST":
      return {
        ...state,
        leave: {
          ...state.leave,
          requests: state.leave.requests.map((req) =>
            req.id === action.payload.id ? { ...req, ...action.payload.data } : req,
          ),
          lastUpdated: new Date().toISOString(),
        },
      }

    case "SET_LEAVE_BALANCE":
      return {
        ...state,
        leave: {
          ...state.leave,
          balance: action.payload,
          lastUpdated: new Date().toISOString(),
        },
      }

    case "ADD_NOTIFICATION":
      const newNotification = { ...action.payload, id: Date.now().toString(), unread: true }
      return {
        ...state,
        notifications: {
          items: [newNotification, ...state.notifications.items],
          unreadCount: state.notifications.unreadCount + 1,
          lastUpdated: new Date().toISOString(),
        },
      }

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          items: state.notifications.items.map((notif) =>
            notif.id === action.payload ? { ...notif, unread: false } : notif,
          ),
          unreadCount: Math.max(0, state.notifications.unreadCount - 1),
        },
      }

    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: {
          items: [],
          unreadCount: 0,
          lastUpdated: new Date().toISOString(),
        },
      }

    case "SET_SYNC_STATUS":
      return {
        ...state,
        sync: {
          ...state.sync,
          status: action.payload,
          lastSync: action.payload === "idle" ? new Date().toISOString() : state.sync.lastSync,
        },
      }

    case "ADD_PENDING_CHANGE":
      return {
        ...state,
        sync: {
          ...state.sync,
          pendingChanges: [...state.sync.pendingChanges, action.payload],
        },
      }

    case "CLEAR_PENDING_CHANGES":
      return {
        ...state,
        sync: {
          ...state.sync,
          pendingChanges: [],
        },
      }

    case "ADD_CONFLICT":
      return {
        ...state,
        sync: {
          ...state.sync,
          conflicts: [...state.sync.conflicts, action.payload],
        },
      }

    case "RESOLVE_CONFLICT":
      return {
        ...state,
        sync: {
          ...state.sync,
          conflicts: state.sync.conflicts.filter((conflict) => conflict.id !== action.payload),
        },
      }

    case "SET_THEME":
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload,
        },
      }

    case "SET_LANGUAGE":
      return {
        ...state,
        ui: {
          ...state.ui,
          language: action.payload,
        },
      }

    case "HYDRATE_STATE":
      return {
        ...state,
        ...action.payload,
      }

    default:
      return state
  }
}

export { initialState, type GlobalState, type GlobalAction }
