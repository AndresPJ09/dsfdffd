
"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Button,
} from "@material-tailwind/react"
import DataTableComponent from "@/widgets/datatable/data-table"
import { Service } from "@/data/api"
import { CheckIcon } from "@heroicons/react/24/solid"
import { DynamicModal } from "@/widgets/Modal/DynamicModal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PlusIcon, TrashIcon } from "lucide-react"
import Swal2 from "sweetalert2"

export function TableModule() {
  const [data, setData] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRow, setSelectedRow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await Service.get("/modulos/")
      setData(response || [])
    } catch (error) {
      console.error("Error al obtener los módulos:", error)
      setError("Error al cargar los datos.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const showSwal = (type, title, message = "", timer = 1500) => {
    Swal2.fire({
      icon: type,
      title: title,
      text: message,
      showConfirmButton: false,
      timer: timer,
      timerProgressBar: true,
      position: "top-end",
      toast: true,
    })
  }

  const handleSubmit = async (formData) => {
    try {
      if (selectedRow) {
        await Service.put(`/modulos/${selectedRow.id}/`, formData)
      } else {
        await Service.post("/modulos/", formData)
      }
      fetchData()
      setIsModalOpen(false)
      setSelectedRow(null)
      showSwal("success", "Módulo guardado exitosamente")
    } catch (error) {
      console.error("Error al guardar el módulo:", error)

      // Verifica si viene una respuesta con errores del backend
      const backendError = error?.response?.data

      // Extrae los mensajes y los convierte a texto plano
      let errorMessage = "Por favor, inténtalo de nuevo más tarde."
      if (backendError) {
        if (typeof backendError === "string") {
          errorMessage = backendError
        } else if (Array.isArray(backendError.detail)) {
          errorMessage = backendError.detail.map((e) => e.msg || e).join("\n")
        } else if (backendError.detail) {
          errorMessage = backendError.detail
        } else {
          // Si es un objeto de campos
          errorMessage = Object.entries(backendError)
            .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
            .join("\n")
        }
      }
      showSwal("error", "Error al guardar el módulo", errorMessage)
    }
  }

  const handleDelete = async (row) => {
    Swal2.fire({
      title: "¿Estás seguro de eliminar este módulo?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await Service.delete(`/modulos/${row.id}/`)
          showSwal("success", "Módulo eliminado correctamente")
          fetchData()
        } catch (error) {
          console.error("Error al eliminar el módulo:", error)
          showSwal("error", "Error al eliminar el módulo", "Inténtalo de nuevo más tarde.")
        }
      }
    })
  }

  const handleAction = (row) => {
    setSelectedRow(row)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedRow(null)
  }

  const modalFields = [
    {
      label: "Nombre",
      name: "nombre",
      type: "text",
      required: true,
      value: selectedRow?.nombre || "",
    },
    {
      label: "Descripción",
      name: "descripcion",
      type: "textarea",
      required: true,
      value: selectedRow?.descripcion || "",
    },
    {
      label: "Icono",
      name: "icono",
      type: "text",
      required: true,
      value: selectedRow?.icono || "",
    },
  ]

  const columns = [
    {
      name: "Nombre",
      selector: (row) => row.nombre,
      sortable: true,
    },
    {
      name: "Descripcion",
      selector: (row) => row.descripcion,
      sortable: true,
    },
    {
      name: "Icono",
      selector: (row) => row.icono,
      sortable: true,
    },
    {
      name: "Acciones",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button color="green" size="sm" className="flex items-center gap-2" onClick={() => handleAction(row)}>
            <CheckIcon className="h-4 w-4" />
          </Button>
          <Button color="red" size="sm" className="flex items-center gap-2" onClick={() => handleDelete(row)}>
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      width: "150px",
    },
  ]

  return (
    <div className="mt-6 mb-8 space-y-6 bg-gradient-to-br from-blue-gray-50 mt-12 rounded-xl min-h-screen via-white to-white">
      <Card className="bg-gradient-to-br from-blue-gray-50 rounded-xl min-h-screen via-white to-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Gestión de módulos</CardTitle>
          <Button
            variant="default"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => {
              setSelectedRow(null)
              setIsModalOpen(true)
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Agregar Nuevo Módulo
          </Button>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <DataTableComponent columns={columns} data={data} title="" loading={isLoading} />
          )}
        </CardContent>
      </Card>
      <DynamicModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        title={selectedRow ? "Editar Módulo" : "Crear Nuevo Módulo"}
        fields={modalFields}
        initialData={selectedRow ? { ...selectedRow } : null}
      />
    </div>
  )
}

export default TableModule