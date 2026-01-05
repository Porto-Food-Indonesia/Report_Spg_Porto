"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import imageCompression from 'browser-image-compression'
import { 
  User, Mail, Phone, MapPin, Calendar, Shield, 
  Camera, Edit2, Save, X, Eye, EyeOff, Lock,
  ArrowLeft, CheckCircle, AlertCircle, Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface UserData {
  id: string
  nama: string
  email: string
  role: string
}

interface EmployeeData {
  id:   string
  name: string
  email: string
  role: string
  status:  string
  joinDate: string
  userId:  string | null
  profilePhoto:   string | null
}

interface UpdateProfileData {
  name:   string
  email: string
  role: string
  status? :  string
  joinDate?:  string
}

interface ChangePasswordData {
  currentPassword:   string
  newPassword:  string
  confirmPassword: string
}

export default function ProfileComponent() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [user, setUser] = useState<UserData | null>(null)
  const [employee, setEmployee] = useState<EmployeeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: "",
    email: "",
    role: "",
    status: "Aktif",
    joinDate:   ""
  })
  
  const [passwordData, setPasswordData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword:   ""
  })
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  })
  
  // Alert states
  const [alert, setAlert] = useState<{
    show: boolean
    type: "success" | "error"
    message: string
  }>({
    show: false,
    type: "success",
    message: ""
  })

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        const userStr = localStorage.getItem("user")
        if (! userStr) {
          console.error("❌ User tidak ditemukan di localStorage")
          router.push("/login")
          return
        }

        const userData = JSON.parse(userStr) as UserData
        console.log("✅ User dari localStorage:", userData)
        setUser(userData)

        await fetchEmployeeData(userData.id)
      } catch (error) {
        console.error("❌ Error saat inisialisasi:", error)
        showAlert("error", "Gagal memuat data profil")
        setLoading(false)
      }
    }

    initializeProfile()
  }, [])

  const fetchEmployeeData = async (userId: string) => {
    try {
      setLoading(true)
      console.log("📡 Fetching employee data untuk userId:", userId)
      
      const response = await fetch("/api/employees/list")
      
      if (!response.ok) {
        throw new Error(`HTTP Error:  ${response.status}`)
      }
      
      const employees = await response.json()
      console.log("✅ Semua employees dari API:", employees)
      
      if (Array.isArray(employees) && employees.length > 0) {
        console.log("📊 Sample employee structure:", employees[0])
      }
      
      // Normalisasi userId untuk perbandingan (BOTH as STRING)
      const searchUserId = String(userId).trim().toLowerCase()
      
      let currentEmployee = employees.find((emp:  any) => {
        // Cek user_id (keduanya string sekarang)
        const empUserId = String(emp.userId || "").trim().toLowerCase()
        if (empUserId && empUserId === searchUserId) {
          console.log("✅ MATCH by userId:", emp.id, "emp.userId:", emp.userId)
          return true
        }
        
        // Cek employee id
        const empId = String(emp. id || "").trim().toLowerCase()
        if (empId && empId === searchUserId) {
          console.log("✅ MATCH by employee id:", emp. id)
          return true
        }
        
        return false
      })

      if (!currentEmployee) {
        console.warn("⚠️ No match found.  Employees:", employees.map((e: any) => ({
          id: e.id,
          name: e.name,
          userId: e.userId,
          userIdType: typeof e.userId
        })))
        throw new Error(
          `Data karyawan dengan userId "${userId}" tidak ditemukan.  ` +
          `Total employees: ${employees.length}. ` +
          `Silakan hubungi administrator.  `
        )
      }

      console.log("✅ Employee ditemukan:", currentEmployee)
      
      const mappedEmployee: EmployeeData = {
        id: currentEmployee.id || "",
        name: currentEmployee.  name || "",
        email: currentEmployee.email || "",
        role: currentEmployee.role || "",
        status: currentEmployee.status || "Aktif",
        joinDate:   currentEmployee.joinDate || "",
        userId: currentEmployee.  userId || null,
        profilePhoto: currentEmployee.profilePhoto || null
      }

      setEmployee(mappedEmployee)
      setFormData({
        name: mappedEmployee.name,
        email: mappedEmployee.email,
        role: mappedEmployee.role,
        status: mappedEmployee. status,
        joinDate: mappedEmployee.joinDate
      })
      
      console.log("✅ Employee mapping berhasil:", mappedEmployee)
    } catch (error) {
      console.error("❌ Error fetching employee:", error)
      showAlert("error", error instanceof Error ? error.message : "Gagal memuat data profil")
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ show: true, type, message })
    setTimeout(() => {
      setAlert({ show: false, type, message:   "" })
    }, 5000)
  }

  const handleUpdateProfile = async () => {
    if (!employee) return
    
    try {
      setIsSaving(true)
      
      const response = await fetch("/api/employees/create", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: employee.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          joinDate: formData.joinDate,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Gagal memperbarui profil")
      }
      
      if (user) {
        await fetchEmployeeData(user.id)
      }
      
      if (user) {
        const updatedUser = {
          ... user,
          nama: formData.name,
          email: formData.email,
          role: formData.role. toLowerCase()
        }
        localStorage.setItem("user", JSON. stringify(updatedUser))
        setUser(updatedUser)
      }
      
      setIsEditing(false)
      showAlert("success", "Profil berhasil diperbarui!")
    } catch (error:   any) {
      console.error("❌ Error updating profile:", error)
      showAlert("error", error. message || "Gagal memperbarui profil")
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!user) return
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showAlert("error", "Password baru tidak cocok!")
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      showAlert("error", "Password minimal 6 karakter!")
      return
    }
    
    try {
      setIsSaving(true)
      
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.  newPassword,
        }),
      })
      
      const data = await response.json()
      
      if (!response. ok) {
        throw new Error(data.  error || "Gagal mengubah password")
      }
      
      setShowPasswordDialog(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      showAlert("success", "Password berhasil diubah!")
    } catch (error:  any) {
      console.error("❌ Error changing password:", error)
      showAlert("error", error.message || "Gagal mengubah password")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePhotoUpload = async (e:   React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?  .[0]
    if (!file || ! employee) return
    
    if (! file.type.startsWith("image/")) {
      showAlert("error", "File harus berupa gambar!")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) {
      showAlert("error", "Ukuran file maksimal 5MB!")
      return
    }
    
    try {
      setUploadingPhoto(true)
      console.log("🖼️ Compressing image:", file.name)
      
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 500,
        useWebWorker: true
      }
      
      const compressedFile = await imageCompression(file, options)
      console.log(`✅ Original size: ${(file.size / 1024).toFixed(2)}KB, Compressed size: ${(compressedFile.size / 1024).toFixed(2)}KB`)
      
      const reader = new FileReader()
      reader.readAsDataURL(compressedFile)
      
      reader.onload = async () => {
        try {
          const base64String = reader.result as string
          console.log(`📊 Base64 length: ${base64String.length}`)
          
          const response = await fetch("/api/employees/upload-photo", {
            method:   "POST",
            headers:  {
              "Content-Type":  "application/json",
            },
            body: JSON.stringify({
              employeeId: employee.id,
              photoUrl: base64String,
            }),
          })
          
          const data = await response.  json()
          
          if (!  response.ok) {
            throw new Error(data.error || "Gagal upload foto")
          }
          
          if (user) {
            await fetchEmployeeData(user.id)
          }
          
          showAlert("success", "Foto profil berhasil diperbarui!")
        } catch (error:   any) {
          console. error("❌ Upload error:", error)
          showAlert("error", error.message || "Gagal mengupload foto")
        } finally {
          setUploadingPhoto(false)
        }
      }
      
      reader.  onerror = () => {
        setUploadingPhoto(false)
        throw new Error("Gagal membaca file")
      }
    } catch (error: any) {
      console.error("❌ Error uploading photo:", error)
      showAlert("error", error.  message || "Gagal mengupload foto")
      setUploadingPhoto(false)
    }
  }

  const getInitials = (name: string) => {
    const names = name.split(" ")
    if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase()
    }
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }

  const getAvatarGradient = (name: string) => {
    const gradients = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-emerald-500 to-teal-500",
      "from-orange-500 to-red-500",
      "from-indigo-500 to-purple-500",
      "from-rose-500 to-pink-500",
      "from-amber-500 to-orange-500",
    ]
    const index = name.charCodeAt(0) % gradients.length
    return gradients[index]
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month:   "long",
      year: "numeric"
    })
  }

  const handleCancel = () => {
    setIsEditing(false)
    if (employee) {
      setFormData({
        name: employee.  name,
        email: employee.  email,
        role: employee.  role,
        status: employee.  status,
        joinDate: employee.joinDate
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Memuat profil...</p>
        </div>
      </div>
    )
  }

  if (!  user || !employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Alert className="max-w-md bg-slate-800 border-slate-700">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-slate-300">
            Gagal memuat data profil.   Silakan login kembali.  
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push("/login")}
          className="absolute bottom-4 left-4 bg-blue-500 hover:bg-blue-600"
        >
          Kembali ke Login
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6 lg:p-8">
      {/* Alert */}
      {alert.show && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top">
          <Alert className={`${
            alert.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {alert.type === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription>{alert.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-xl hover:bg-slate-800 text-slate-400"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Profil Saya
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Kelola informasi profil dan keamanan akun Anda
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="text-center">
                  {/* Profile Photo */}
                  <div className="relative inline-block mb-4">
                    <div className="relative">
                      {employee.  profilePhoto ?   (
                        <img
                          src={employee.profilePhoto}
                          alt={employee.name}
                          className="w-32 h-32 rounded-2xl object-cover ring-4 ring-slate-700"
                        />
                      ) : (
                        <div 
                          className={`
                            w-32 h-32 rounded-2xl
                            bg-gradient-to-br ${getAvatarGradient(employee.name)}
                            flex items-center justify-center
                            text-4xl font-bold text-white
                            ring-4 ring-slate-700
                          `}
                        >
                          {getInitials(employee.name)}
                        </div>
                      )}
                      
                      {/* Upload Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                        className="absolute bottom-0 right-0 p-2 bg-blue-500 hover:bg-blue-600 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingPhoto ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Camera className="w-4 h-4" />
                        )}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Name & Role */}
                  <h2 className="text-xl font-bold text-white mb-1">
                    {employee.name}
                  </h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                    <Shield className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400 capitalize font-medium">
                      {user.  role}
                    </span>
                  </div>

                  {/* Status */}
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4 ${
                    employee. status === "Aktif"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      employee.status === "Aktif" ?   "bg-emerald-400" : "bg-red-400"
                    }`} />
                    <span className="text-sm font-medium">
                      {employee.status}
                    </span>
                  </div>

                  {/* Join Date */}
                  {employee.joinDate && (
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mt-4">
                      <Calendar className="w-4 h-4" />
                      <span>Bergabung {formatDate(employee.joinDate)}</span>
                    </div>
                  )}

                  {/* Change Password Button */}
                  <Button
                    onClick={() => setShowPasswordDialog(true)}
                    className="w-full mt-6 bg-slate-700 hover:bg-slate-600 text-white"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Ubah Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Informasi Profil</CardTitle>
                    <CardDescription className="text-slate-400">
                      {isEditing 
                        ? "Perbarui informasi profil Anda" 
                        :   "Detail informasi akun Anda"}
                    </CardDescription>
                  </div>
                  
                  {!  isEditing ?   (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit Profil
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="border-slate-600 text-slate-400 hover:bg-slate-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Batal
                      </Button>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className="bg-blue-500 hover: bg-blue-600 text-white"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Simpan
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Nama */}
                <div className="space-y-2">
                  <Label htmlFor="nama" className="text-slate-300 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Nama Lengkap
                  </Label>
                  {isEditing ? (
                    <Input
                      id="nama"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e. target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="Masukkan nama lengkap"
                    />
                  ) : (
                    <p className="text-white font-medium px-3 py-2 bg-slate-700/30 rounded-lg">
                      {employee.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  {isEditing ? (
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="Masukkan email"
                    />
                  ) : (
                    <p className="text-white font-medium px-3 py-2 bg-slate-700/30 rounded-lg">
                      {employee.email}
                    </p>
                  )}
                </div>

                {/* Posisi/Role */}
                <div className="space-y-2">
                  <Label htmlFor="posisi" className="text-slate-300 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Posisi
                  </Label>
                  {isEditing ? (
                    <Input
                      id="posisi"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="bg-slate-700/50 border-slate-600 text-white"
                      placeholder="Masukkan posisi"
                    />
                  ) : (
                    <p className="text-white font-medium px-3 py-2 bg-slate-700/30 rounded-lg">
                      {employee.role || "-"}
                    </p>
                  )}
                </div>

                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-xs text-blue-400 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Untuk menambahkan informasi kontak dan alamat, silakan hubungi administrator.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription className="text-slate-400">
              Masukkan password lama dan password baru Anda
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-slate-300">
                Password Lama
              </Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword.  current ? "text" : "password"}
                  value={passwordData. currentPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.  value
                  })}
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                  placeholder="Masukkan password lama"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({
                    ...showPassword,
                    current: !showPassword.current
                  })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword.current ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-slate-300">
                Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value
                  })}
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                  placeholder="Masukkan password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({
                    ...showPassword,
                    new: !  showPassword.new
                  })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword.  new ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Konfirmasi Password Baru
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  value={passwordData.  confirmPassword}
                  onChange={(e) => setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.  value
                  })}
                  className="bg-slate-700/50 border-slate-600 text-white pr-10"
                  placeholder="Konfirmasi password baru"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({
                    ...showPassword,
                    confirm: ! showPassword.confirm
                  })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showPassword. confirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="text-xs text-blue-400">
                Password harus minimal 6 karakter
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPasswordDialog(false)
                setPasswordData({
                  currentPassword: "",
                  newPassword: "",
                  confirmPassword: ""
                })
              }}
              className="border-slate-600 text-slate-400 hover:bg-slate-700"
            >
              Batal
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isSaving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan... 
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Ubah Password
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}