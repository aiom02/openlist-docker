package model

import "time"

// ImageFavoriteFolder represents an image favorite folder
type ImageFavoriteFolder struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserId      uint      `json:"user_id" gorm:"not null;index:idx_image_folder_user"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	Order       int       `json:"order" gorm:"default:0"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (ImageFavoriteFolder) TableName() string {
	return "image_favorite_folders"
}

// ImageFavorite represents a favorited image
type ImageFavorite struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserId       uint      `json:"user_id" gorm:"not null;index:idx_image_user"`
	FolderId     uint      `json:"folder_id" gorm:"not null;index:idx_image_folder"`
	StorageId    uint      `json:"storage_id" gorm:"default:0"`
	OriginalPath string    `json:"original_path" gorm:"not null"`
	FileName     string    `json:"file_name" gorm:"not null"`
	Note         string    `json:"note"`
	Fingerprint  string    `json:"fingerprint"`
	CreatedAt    time.Time `json:"created_at"`
}

func (ImageFavorite) TableName() string {
	return "image_favorites"
}
