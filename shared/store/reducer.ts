import type { AppState, Action } from "./types"

export const initialState: AppState = {
  user: {
    currentUser: null,
    isAuthenticated: false,
    permissions: [],
    preferences: {
      theme: "light",
      language: "en",
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      dateFormat: "DD/MM/YYYY",
      currency: "GHS",
    },
    loading: false,
    error: null,
  },
  employees: {
    employees: [],
    selectedEmployee: null,
    loading: false,
    error: null,
    filters: {
      department: "",
      status: "",
      search: "",
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
    },
  },
  payroll: {
    payslips: [],
    currentPayroll: null,
    processing: false,
    loading: false,
    error: null,
    filters: {
      period: "",
      employee: "",
    },
  },
  leave: {
    requests: [],
    balance: null,
    types: [],
    loading: false,
    error: null,
    filters: {
      status: "",
      employee: "",
      dateRange: null,
    },
  },
  notifications: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
  },
  performance: {
    goals: [],
    reviews: [],
    competencies: [],
    loading: false,
    error: null,
  },
  learning: {
    courses: [],
    enrollments: [],
    certifications: [],
    progress: [],
    loading: false,
    error: null,
  },
  ui: {
    sidebarOpen: true,
    theme: "light",
    loading: {
      global: false,
    },
    modals: {},
    toast: null,
  },
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_USER":
      return {
        ...state,
        user: {
          ...state.user,
          currentUser: action.payload,
          isAuthenticated: !!action.payload,
        },
      }

    case "SET_LOADING":
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: {
            ...state.ui.loading,
            [action.payload.section]: action.payload.loading,
          },
        },
      }

    case "SET_ERROR":
      return {
        ...state,
        user: {
          ...state.user,
          error: action.payload,
        },
      }

    case "SET_EMPLOYEES":
      return {
        ...state,
        employees: {
          ...state.employees,
          employees: action.payload,
          loading: false,
          error: null,
        },
      }

    case "ADD_EMPLOYEE":
      return {
        ...state,
        employees: {
          ...state.employees,
          employees: [...state.employees.employees, action.payload],
        },
      }

    case "UPDATE_EMPLOYEE":
      return {
        ...state,
        employees: {
          ...state.employees,
          employees: state.employees.employees.map((emp) =>
            emp.id === action.payload.id ? { ...emp, ...action.payload } : emp,
          ),
        },
      }

    case "DELETE_EMPLOYEE":
      return {
        ...state,
        employees: {
          ...state.employees,
          employees: state.employees.employees.filter((emp) => emp.id !== action.payload),
        },
      }

    case "SET_PAYSLIPS":
      return {
        ...state,
        payroll: {
          ...state.payroll,
          payslips: action.payload,
          loading: false,
          error: null,
        },
      }

    case "ADD_PAYSLIP":
      return {
        ...state,
        payroll: {
          ...state.payroll,
          payslips: [...state.payroll.payslips, action.payload],
        },
      }

    case "SET_LEAVE_REQUESTS":
      return {
        ...state,
        leave: {
          ...state.leave,
          requests: action.payload,
          loading: false,
          error: null,
        },
      }

    case "ADD_LEAVE_REQUEST":
      return {
        ...state,
        leave: {
          ...state.leave,
          requests: [...state.leave.requests, action.payload],
        },
      }

    case "UPDATE_LEAVE_REQUEST":
      return {
        ...state,
        leave: {
          ...state.leave,
          requests: state.leave.requests.map((req) =>
            req.id === action.payload.id ? { ...req, ...action.payload } : req,
          ),
        },
      }

    case "SET_NOTIFICATIONS":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          notifications: action.payload,
          unreadCount: action.payload.filter((n: any) => !n.read).length,
          loading: false,
          error: null,
        },
      }

    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          notifications: [action.payload, ...state.notifications.notifications],
          unreadCount: state.notifications.unreadCount + 1,
        },
      }

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: {
          ...state.notifications,
          notifications: state.notifications.notifications.map((n) =>
            n.id === action.payload ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, state.notifications.unreadCount - 1),
        },
      }

    case "SET_GOALS":
      return {
        ...state,
        performance: {
          ...state.performance,
          goals: action.payload,
          loading: false,
          error: null,
        },
      }

    case "ADD_GOAL":
      return {
        ...state,
        performance: {
          ...state.performance,
          goals: [...state.performance.goals, action.payload],
        },
      }

    case "UPDATE_GOAL":
      return {
        ...state,
        performance: {
          ...state.performance,
          goals: state.performance.goals.map((goal) =>
            goal.id === action.payload.id ? { ...goal, ...action.payload } : goal,
          ),
        },
      }

    case "SET_COURSES":
      return {
        ...state,
        learning: {
          ...state.learning,
          courses: action.payload,
          loading: false,
          error: null,
        },
      }

    case "ENROLL_COURSE":
      return {
        ...state,
        learning: {
          ...state.learning,
          enrollments: [...state.learning.enrollments, action.payload.enrollment],
          courses: state.learning.courses.map((course) =>
            course.id === action.payload.courseId ? { ...course, status: "enrolled" } : course,
          ),
        },
      }

    case "COMPLETE_COURSE":
      return {
        ...state,
        learning: {
          ...state.learning,
          courses: state.learning.courses.map((course) =>
            course.id === action.payload.courseId ? { ...course, status: "completed" } : course,
          ),
        },
      }

    case "SHOW_TOAST":
      return {
        ...state,
        ui: {
          ...state.ui,
          toast: action.payload,
        },
      }

    case "HIDE_TOAST":
      return {
        ...state,
        ui: {
          ...state.ui,
          toast: null,
        },
      }

    case "TOGGLE_SIDEBAR":
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarOpen: !state.ui.sidebarOpen,
        },
      }

    case "SET_THEME":
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload,
        },
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            theme: action.payload,
          },
        },
      }

    default:
      return state
  }
}
