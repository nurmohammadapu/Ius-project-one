// const { prisma } = require("../config/database");

// function getRandomInt(max) {
//   return Math.floor(Math.random() * max);
// }

// exports.createCategory = async (req, res) => {
//   try {
//     const { name, description } = req.body;
//     if (!name) {
//       return res
//         .status(400)
//         .json({ success: false, message: "All fields are required" });
//     }
//     const CategorysDetails = await prisma.category.create({
//       data: {
//         name: name,
//         description: description,
//       },
//     });
//     console.log(CategorysDetails);
//     return res.status(200).json({
//       success: true,
//       message: "Categorys Created Successfully",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.showAllCategories = async (req, res) => {
//   try {
//     const allCategorys = await prisma.category.findMany({
//       include: {
//         courses: true,
//       },
//     });
//     res.status(200).json({
//       success: true,
//       data: allCategorys,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: error.message,
//     });
//   }
// };

// exports.categoryPageDetails = async (req, res) => {
//   try {
//     const { categoryId } = req.body;

//     // Get courses for the specified category
//     const selectedCategory = await prisma.category.findUnique({
//       where: { id: categoryId },
//       include: {
//         courses: {
//           where: { status: "Published" },
//           include: {
//             ratingAndReviews: true,
//           },
//         },
//       },
//     });

//     console.log("SELECTED COURSE", selectedCategory);
//     if (!selectedCategory) {
//       console.log("Category not found.");
//       return res
//         .status(404)
//         .json({ success: false, message: "Category not found" });
//     }

//     if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
//       console.log("No courses found for the selected category.");
//       return res.status(404).json({
//         success: false,
//         message: "No courses found for the selected category.",
//       });
//     }

//     // Get courses for other categories
//     const categoriesExceptSelected = await prisma.category.findMany({
//       where: {
//         id: { not: categoryId },
//       },
//     });

//     let differentCategory = null;
//     if (categoriesExceptSelected.length > 0) {
//       const randomIndex = getRandomInt(categoriesExceptSelected.length);
//       const randomCategoryId = categoriesExceptSelected[randomIndex].id;
//       differentCategory = await prisma.category.findUnique({
//         where: { id: randomCategoryId },
//         include: {
//           courses: {
//             where: { status: "Published" },
//           },
//         },
//       });
//     }

//     // Get top-selling courses across all categories
//     const allCategories = await prisma.category.findMany({
//       include: {
//         courses: {
//           where: { status: "Published" },
//           include: {
//             studentsEnroled: true,
//           },
//         },
//       },
//     });

//     const allCourses = allCategories.flatMap((category) => category.courses);
//     const mostSellingCourses = allCourses
//       .sort((a, b) => (b.studentsEnroled?.length || 0) - (a.studentsEnroled?.length || 0))
//       .slice(0, 10);

//     res.status(200).json({
//       success: true,
//       data: {
//         selectedCategory,
//         differentCategory,
//         mostSellingCourses,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };

// exports.updateCategory = async (req, res) => {
//   try {
//     const { categoryId, name, description } = req.body;

//     if (!categoryId) {
//       return res.status(400).json({
//         success: false,
//         message: "Category ID is required",
//       });
//     }

//     let category = await prisma.category.findUnique({
//       where: { id: categoryId },
//     });
//     if (!category) {
//       return res.status(404).json({
//         success: false,
//         message: "Category not found",
//       });
//     }

//     const updatedCategory = await prisma.category.update({
//       where: { id: categoryId },
//       data: {
//         name: name || category.name,
//         description: description !== undefined ? description : category.description,
//       },
//     });

//     return res.status(200).json({
//       success: true,
//       message: "Category updated successfully",
//       data: updatedCategory,
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// };







const { prisma } = require("../config/database");

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// 1. createCategory (Pure Raw Query)
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const categoryDetails = await prisma.$queryRaw`
      INSERT INTO "Category" (id, name, description)
      VALUES (
        gen_random_uuid()::text,
        ${name},
        ${description || null}
      )
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Category Created Successfully",
      data: categoryDetails[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// 2. showAllCategories (Pure Raw Query with JSON Aggregation)
exports.showAllCategories = async (req, res) => {
  try {
    const allCategories = await prisma.$queryRaw`
      SELECT 
        cat.id,
        cat.name,
        cat.description,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', c.id,
                'courseName', c."courseName",
                'courseDescription', c."courseDescription",
                'price', c.price,
                'thumbnail', c.thumbnail,
                'status', c.status
              )
            )
            FROM "Course" c
            WHERE c."categoryId" = cat.id
          ),
          '[]'::json
        ) AS courses
      FROM "Category" cat
      ORDER BY cat.name ASC
    `;

    return res.status(200).json({
      success: true,
      data: allCategories,
    });
  } catch (error) {
    console.error("SHOW ALL CATEGORIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. categoryPageDetails (Pure Raw Query with Subqueries & Aggregations)
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryId } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    // A. Selected Category with Published Courses and Ratings
    const selectedCategoryResult = await prisma.$queryRaw`
      SELECT 
        cat.id,
        cat.name,
        cat.description,
        COALESCE(
          json_agg(
            json_build_object(
              'id', c.id,
              'courseName', c."courseName",
              'courseDescription', c."courseDescription",
              'price', c.price,
              'thumbnail', c.thumbnail,
              'status', c.status,
              'ratingAndReviews', (
                SELECT COALESCE(json_agg(r.*), '[]'::json)
                FROM "RatingAndReview" r
                WHERE r."courseId" = c.id
              )
            )
          ) FILTER (WHERE c.id IS NOT NULL AND c.status = 'Published'::"CourseStatus"),
          '[]'::json
        ) AS courses
      FROM "Category" cat
      LEFT JOIN "Course" c ON cat.id = c."categoryId"
      WHERE cat.id = ${categoryId}
      GROUP BY cat.id
    `;

    const selectedCategory = selectedCategoryResult[0];

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!selectedCategory.courses || selectedCategory.courses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }

    // B. Get Random Different Category
    const otherCategories = await prisma.$queryRaw`
      SELECT id FROM "Category" WHERE id != ${categoryId}
    `;

    let differentCategory = null;
    if (otherCategories && otherCategories.length > 0) {
      const randomIndex = getRandomInt(otherCategories.length);
      const randomCategoryId = otherCategories[randomIndex].id;

      const differentCategoryResult = await prisma.$queryRaw`
        SELECT 
          cat.id,
          cat.name,
          cat.description,
          COALESCE(
            json_agg(c.*) FILTER (WHERE c.id IS NOT NULL AND c.status = 'Published'::"CourseStatus"),
            '[]'::json
          ) AS courses
        FROM "Category" cat
        LEFT JOIN "Course" c ON cat.id = c."categoryId"
        WHERE cat.id = ${randomCategoryId}
        GROUP BY cat.id
      `;
      differentCategory = differentCategoryResult[0] || null;
    }

    // C. Top Selling Courses Across All Categories (Joining "_EnrolledStudents")
    const mostSellingCourses = await prisma.$queryRaw`
      SELECT 
        c.id,
        c."courseName",
        c."courseDescription",
        c.price,
        c.thumbnail,
        c.status,
        c."categoryId",
        COUNT(es."B")::int AS "enrolledCount"
      FROM "Course" c
      LEFT JOIN "_EnrolledStudents" es ON es."A" = c.id
      WHERE c.status = 'Published'::"CourseStatus"
      GROUP BY c.id
      ORDER BY "enrolledCount" DESC
      LIMIT 10
    `;

    res.status(200).json({
      success: true,
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// 4. updateCategory (Pure Raw Query)
exports.updateCategory = async (req, res) => {
  try {
    const { categoryId, name, description } = req.body;

    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: "Category ID is required",
      });
    }

    const existingCategory = await prisma.$queryRaw`
      SELECT * FROM "Category" WHERE id = ${categoryId}
    `;

    if (!existingCategory || existingCategory.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const currentCat = existingCategory[0];
    const updatedName = name || currentCat.name;
    const updatedDescription = description !== undefined ? description : currentCat.description;

    const updatedCategory = await prisma.$queryRaw`
      UPDATE "Category"
      SET 
        name = ${updatedName},
        description = ${updatedDescription}
      WHERE id = ${categoryId}
      RETURNING *
    `;

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: updatedCategory[0],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};