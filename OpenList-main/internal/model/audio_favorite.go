package model

import (
	"time"
)

// AudioFavoriteFolder represents a folder that contains favorite audios
type AudioFavoriteFolder struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	UserId      uint      `json:"user_id" gorm:"index"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	Order       int       `json:"order"` // for sorting folders
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// AudioFavorite represents an audio in a favorite folder
type AudioFavorite struct {
	ID           uint      `json:"id" gorm:"primaryKey"`
	UserId       uint      `json:"user_id" gorm:"index"`
	FolderId     uint      `json:"folder_id" gorm:"index"`
	StorageId    uint      `json:"storage_id"`
	OriginalPath string    `json:"original_path" gorm:"not null"` // full path to audio file
	FileName     string    `json:"file_name" gorm:"not null"`     // audio filename
	Note         string    `json:"note" gorm:"type:text"`         // optional user note
	Fingerprint  string    `json:"fingerprint" gorm:"index"`      // for linking with media marks
	CreatedAt    time.Time `json:"created_at"`
}


